#!/usr/bin/env python3
"""
Leadion Native Android APK Packager & Signer
Generates an installable, V1/JAR-signed Android APK (com.leadion.app v1.0.0)
containing:
- Binary AndroidManifest.xml (AXML format)
- Compiled Dalvik bytecode classes.dex (com.leadion.app.MainActivity hosting full-screen WebView with IndexedDB + DOMStorage enabled)
- Binary resources.arsc & launcher mipmap icons
- Production compiled web assets (assets/public/index.html + JS/CSS bundles)
- Cryptographic RSA-2048 signature (META-INF/MANIFEST.MF, CERT.SF, CERT.RSA)
"""

import base64
import hashlib
import os
import shutil
import struct
import subprocess
import tempfile
import zlib
import zipfile
from pathlib import Path


# ============================================================================
# 1. BINARY ANDROID MANIFEST (AXML) COMPILER
# ============================================================================
def build_axml_manifest() -> bytes:
    # Android attribute resource IDs (must appear first in the string pool in exact order)
    attr_specs = [
        ("versionCode", 0x0101021B),
        ("versionName", 0x0101021C),
        ("minSdkVersion", 0x0101020C),
        ("targetSdkVersion", 0x01010270),
        ("name", 0x01010003),
        ("label", 0x01010001),
        ("allowBackup", 0x01010280),
        ("usesCleartextTraffic", 0x010104EC),
        ("hardwareAccelerated", 0x010102D3),
        ("theme", 0x01010000),
        ("exported", 0x01010010),
        ("configChanges", 0x0101001F),
    ]

    other_strings = [
        "android",
        "http://schemas.android.com/apk/res/android",
        "manifest",
        "package",
        "com.leadion.app",
        "1.0.0",
        "uses-sdk",
        "uses-permission",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "application",
        "Leadion",
        "activity",
        "com.leadion.app.MainActivity",
        "intent-filter",
        "action",
        "android.intent.action.MAIN",
        "category",
        "android.intent.category.LAUNCHER",
        "",
    ]

    all_strings = [name for name, _ in attr_specs] + other_strings
    str_idx = {s: i for i, s in enumerate(all_strings)}

    # Build UTF-16LE String Pool Chunk (RES_STRING_POOL_TYPE = 0x0001)
    encoded_strings = []
    offsets = []
    cur_offset = 0
    for s in all_strings:
        offsets.append(cur_offset)
        u16 = s.encode("utf-16le")
        entry = struct.pack("<H", len(s)) + u16 + b"\x00\x00"
        encoded_strings.append(entry)
        cur_offset += len(entry)

    strings_blob = b"".join(encoded_strings)
    while len(strings_blob) % 4 != 0:
        strings_blob += b"\x00"

    string_count = len(all_strings)
    header_size = 28
    strings_start = header_size + string_count * 4
    chunk_size = strings_start + len(strings_blob)

    string_pool_chunk = (
        struct.pack(
            "<HHIIIIII",
            0x0001,  # RES_STRING_POOL_TYPE
            header_size,
            chunk_size,
            string_count,
            0,  # styleCount
            0,  # flags (UTF-16)
            strings_start,
            0,  # stylesStart
        )
        + b"".join(struct.pack("<I", o) for o in offsets)
        + strings_blob
    )

    # Build Resource Map Chunk (RES_XML_RESOURCE_MAP_TYPE = 0x0180)
    res_ids = [rid for _, rid in attr_specs]
    res_map_size = 8 + len(res_ids) * 4
    res_map_chunk = struct.pack("<HHI", 0x0180, 8, res_map_size) + b"".join(
        struct.pack("<I", rid) for rid in res_ids
    )

    # Helper functions for XML chunks
    NS_URI = str_idx["http://schemas.android.com/apk/res/android"]
    NS_PREFIX = str_idx["android"]
    NULL_IDX = 0xFFFFFFFF

    TYPE_STRING = 0x03
    TYPE_INT_DEC = 0x10
    TYPE_INT_HEX = 0x11
    TYPE_INT_BOOLEAN = 0x12
    TYPE_REFERENCE = 0x01

    def start_ns(line: int) -> bytes:
        return struct.pack(
            "<HHIIIII",
            0x0100,
            16,
            24,
            line,
            NULL_IDX,
            NS_PREFIX,
            NS_URI,
        )

    def end_ns(line: int) -> bytes:
        return struct.pack(
            "<HHIIIII",
            0x0101,
            16,
            24,
            line,
            NULL_IDX,
            NS_PREFIX,
            NS_URI,
        )

    def attr_str(ns: int, name_str: str, val_str: str) -> bytes:
        n_idx = str_idx[name_str]
        v_idx = str_idx[val_str]
        return struct.pack(
            "<IIIHBBI",
            ns,
            n_idx,
            v_idx,
            8,
            0,
            TYPE_STRING,
            v_idx,
        )

    def attr_int(ns: int, name_str: str, val: int, vtype: int = TYPE_INT_DEC) -> bytes:
        n_idx = str_idx[name_str]
        return struct.pack(
            "<IIIHBBI",
            ns,
            n_idx,
            NULL_IDX,
            8,
            0,
            vtype,
            val & 0xFFFFFFFF,
        )

    def start_el(line: int, tag_name: str, attrs: list[bytes]) -> bytes:
        attr_blob = b"".join(attrs)
        total = 36 + len(attr_blob)
        return (
            struct.pack(
                "<HHIIIIIHHHHHH",
                0x0102,  # RES_XML_START_ELEMENT_TYPE
                16,
                total,
                line,
                NULL_IDX,
                NULL_IDX,  # elem ns
                str_idx[tag_name],
                20,  # attributeStart
                20,  # attributeSize
                len(attrs),
                0,  # idIndex
                0,  # classIndex
                0,  # styleIndex
            )
            + attr_blob
        )

    def end_el(line: int, tag_name: str) -> bytes:
        return struct.pack(
            "<HHIIIII",
            0x0103,  # RES_XML_END_ELEMENT_TYPE
            16,
            24,
            line,
            NULL_IDX,
            NULL_IDX,
            str_idx[tag_name],
        )

    xml_nodes = [
        start_ns(2),
        # <manifest package="com.leadion.app" android:versionCode="1" android:versionName="1.0.0">
        start_el(
            2,
            "manifest",
            [
                attr_int(NS_URI, "versionCode", 1, TYPE_INT_DEC),
                attr_str(NS_URI, "versionName", "1.0.0"),
                attr_str(NULL_IDX, "package", "com.leadion.app"),
            ],
        ),
        # <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />
        start_el(
            6,
            "uses-sdk",
            [
                attr_int(NS_URI, "minSdkVersion", 24, TYPE_INT_DEC),
                attr_int(NS_URI, "targetSdkVersion", 34, TYPE_INT_DEC),
            ],
        ),
        end_el(6, "uses-sdk"),
        # <uses-permission android:name="android.permission.INTERNET" />
        start_el(
            8,
            "uses-permission",
            [attr_str(NS_URI, "name", "android.permission.INTERNET")],
        ),
        end_el(8, "uses-permission"),
        # <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
        start_el(
            9,
            "uses-permission",
            [attr_str(NS_URI, "name", "android.permission.ACCESS_NETWORK_STATE")],
        ),
        end_el(9, "uses-permission"),
        # <application android:label="Leadion" android:allowBackup="true" android:usesCleartextTraffic="true" android:hardwareAccelerated="true" android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
        start_el(
            11,
            "application",
            [
                attr_int(NS_URI, "theme", 0x01030129, TYPE_REFERENCE),  # Theme.DeviceDefault.NoActionBar
                attr_str(NS_URI, "label", "Leadion"),
                attr_int(NS_URI, "allowBackup", 0xFFFFFFFF, TYPE_INT_BOOLEAN),
                attr_int(NS_URI, "hardwareAccelerated", 0xFFFFFFFF, TYPE_INT_BOOLEAN),
                attr_int(NS_URI, "usesCleartextTraffic", 0xFFFFFFFF, TYPE_INT_BOOLEAN),
            ],
        ),
        # <activity android:name="com.leadion.app.MainActivity" android:label="Leadion" android:exported="true" android:configChanges="0x04a0">
        start_el(
            17,
            "activity",
            [
                attr_str(NS_URI, "label", "Leadion"),
                attr_str(NS_URI, "name", "com.leadion.app.MainActivity"),
                attr_int(NS_URI, "exported", 0xFFFFFFFF, TYPE_INT_BOOLEAN),
                attr_int(NS_URI, "configChanges", 0x000004A0, TYPE_INT_HEX),
            ],
        ),
        # <intent-filter>
        start_el(22, "intent-filter", []),
        start_el(23, "action", [attr_str(NS_URI, "name", "android.intent.action.MAIN")]),
        end_el(23, "action"),
        start_el(24, "category", [attr_str(NS_URI, "name", "android.intent.category.LAUNCHER")]),
        end_el(24, "category"),
        end_el(25, "intent-filter"),
        end_el(26, "activity"),
        end_el(27, "application"),
        end_el(28, "manifest"),
        end_ns(28),
    ]

    body = string_pool_chunk + res_map_chunk + b"".join(xml_nodes)
    return struct.pack("<HHI", 0x0003, 8, 8 + len(body)) + body


# ============================================================================
# 2. DALVIK EXECUTABLE (classes.dex) COMPILER
# ============================================================================
def uleb128(val: int) -> bytes:
    out = bytearray()
    while True:
        b = val & 0x7F
        val >>= 7
        if val != 0:
            out.append(b | 0x80)
        else:
            out.append(b)
            break
    return bytes(out)


def build_classes_dex() -> bytes:
    """
    Constructs a valid Dalvik DEX (035) containing:
    package com.leadion.app;
    public class MainActivity extends android.app.Activity {
        public MainActivity() { super(); }
        protected void onCreate(android.os.Bundle b) {
            super.onCreate(b);
            android.webkit.WebView wv = new android.webkit.WebView(this);
            android.webkit.WebSettings ws = wv.getSettings();
            ws.setJavaScriptEnabled(true);
            ws.setDomStorageEnabled(true);
            ws.setDatabaseEnabled(true);
            ws.setAllowFileAccess(true);
            wv.setWebViewClient(new android.webkit.WebViewClient());
            this.setContentView(wv);
            wv.loadUrl("file:///android_asset/public/index.html");
        }
    }
    """
    strings = sorted(
        [
            "<init>",
            "L",
            "Landroid/app/Activity;",
            "Landroid/content/Context;",
            "Landroid/os/Bundle;",
            "Landroid/view/View;",
            "Landroid/webkit/WebSettings;",
            "Landroid/webkit/WebView;",
            "Landroid/webkit/WebViewClient;",
            "Lcom/leadion/app/MainActivity;",
            " MainActivity.java",
            "V",
            "VL",
            "VZ",
            "Z",
            "file:///android_asset/public/index.html",
            "getSettings",
            "loadUrl",
            "onCreate",
            "setAllowFileAccess",
            "setContentView",
            "setDatabaseEnabled",
            "setDomStorageEnabled",
            "setJavaScriptEnabled",
            "setWebViewClient",
        ]
    )
    s_idx = {s: i for i, s in enumerate(strings)}

    type_names = sorted(
        [
            "Landroid/app/Activity;",
            "Landroid/content/Context;",
            "Landroid/os/Bundle;",
            "Landroid/view/View;",
            "Landroid/webkit/WebSettings;",
            "Landroid/webkit/WebView;",
            "Landroid/webkit/WebViewClient;",
            "Lcom/leadion/app/MainActivity;",
            "Ljava/lang/String;",
            "V",
            "Z",
        ]
    )
    # Add Ljava/lang/String; to strings as well
    if "Ljava/lang/String;" not in s_idx:
        strings = sorted(strings + ["Ljava/lang/String;"])
        s_idx = {s: i for i, s in enumerate(strings)}

    t_idx = {t: i for i, t in enumerate(type_names)}

    # Protos: (shorty, return_type, [params])
    protos = [
        ("V", "V", []),  # ()V
        ("VL", "V", ["Landroid/content/Context;"]),  # (Context)V
        ("VL", "V", ["Landroid/os/Bundle;"]),  # (Bundle)V
        ("VL", "V", ["Landroid/view/View;"]),  # (View)V
        ("VL", "V", ["Landroid/webkit/WebViewClient;"]),  # (WebViewClient)V
        ("VL", "V", ["Ljava/lang/String;"]),  # (String)V
        ("VZ", "V", ["Z"]),  # (boolean)V
        ("L", "Landroid/webkit/WebSettings;", []),  # ()WebSettings
    ]
    # Sort protos by return_type idx then params
    protos.sort(key=lambda p: (t_idx[p[1]], [t_idx[x] for x in p[2]]))
    p_idx = {(p[1], tuple(p[2])): i for i, p in enumerate(protos)}

    # Methods: (class_type, proto_key, name)
    methods = [
        ("Landroid/app/Activity;", ("V", ()), "<init>"),
        ("Landroid/app/Activity;", ("V", ("Landroid/os/Bundle;",)), "onCreate"),
        ("Landroid/app/Activity;", ("V", ("Landroid/view/View;",)), "setContentView"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setAllowFileAccess"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setDatabaseEnabled"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setDomStorageEnabled"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setJavaScriptEnabled"),
        ("Landroid/webkit/WebView;", ("V", ("Landroid/content/Context;",)), "<init>"),
        ("Landroid/webkit/WebView;", ("Landroid/webkit/WebSettings;", ()), "getSettings"),
        ("Landroid/webkit/WebView;", ("V", ("Ljava/lang/String;",)), "loadUrl"),
        ("Landroid/webkit/WebView;", ("V", ("Landroid/webkit/WebViewClient;",)), "setWebViewClient"),
        ("Landroid/webkit/WebViewClient;", ("V", ()), "<init>"),
        ("Lcom/leadion/app/MainActivity;", ("V", ()), "<init>"),
        ("Lcom/leadion/app/MainActivity;", ("V", ("Landroid/os/Bundle;",)), "onCreate"),
    ]
    methods.sort(key=lambda m: (t_idx[m[0]], s_idx[m[2]], p_idx[m[1]]))
    m_idx = {(m[0], m[2], m[1]): i for i, m in enumerate(methods)}

    # Code item 1: MainActivity.<init>()V
    # registers=1, ins=1, outs=1, tries=0
    # invoke-direct {v0}, Landroid/app/Activity;-><init>()V  (70 10 <m_id> 0000)
    # return-void (0e 00)
    act_init_m = m_idx[("Landroid/app/Activity;", "<init>", ("V", ()))]
    init_insns = struct.pack("<HHHH", 0x1070, act_init_m, 0x0000, 0x000E)
    code_init = struct.pack("<HHHHII", 1, 1, 1, 0, 0, len(init_insns) // 2) + init_insns

    # Code item 2: MainActivity.onCreate(Bundle)V
    # registers=4 (v0=wv/ws, v1=true/wvc/url, v2=this, v3=bundle), ins=2, outs=2
    m_super_oncreate = m_idx[("Landroid/app/Activity;", "onCreate", ("V", ("Landroid/os/Bundle;",)))]
    m_wv_init = m_idx[("Landroid/webkit/WebView;", "<init>", ("V", ("Landroid/content/Context;",)))]
    m_wv_settings = m_idx[("Landroid/webkit/WebView;", "getSettings", ("Landroid/webkit/WebSettings;", ()))]
    m_js_enabled = m_idx[("Landroid/webkit/WebSettings;", "setJavaScriptEnabled", ("V", ("Z",)))]
    m_dom_enabled = m_idx[("Landroid/webkit/WebSettings;", "setDomStorageEnabled", ("V", ("Z",)))]
    m_db_enabled = m_idx[("Landroid/webkit/WebSettings;", "setDatabaseEnabled", ("V", ("Z",)))]
    m_file_access = m_idx[("Landroid/webkit/WebSettings;", "setAllowFileAccess", ("V", ("Z",)))]
    m_wvc_init = m_idx[("Landroid/webkit/WebViewClient;", "<init>", ("V", ()))]
    m_set_wvc = m_idx[("Landroid/webkit/WebView;", "setWebViewClient", ("V", ("Landroid/webkit/WebViewClient;",)))]
    m_set_content = m_idx[("Landroid/app/Activity;", "setContentView", ("V", ("Landroid/view/View;",)))]
    m_load_url = m_idx[("Landroid/webkit/WebView;", "loadUrl", ("V", ("Ljava/lang/String;",)))]

    t_webview = t_idx["Landroid/webkit/WebView;"]
    t_wvc = t_idx["Landroid/webkit/WebViewClient;"]
    s_url = s_idx["file:///android_asset/public/index.html"]

    insns_words = [
        # invoke-super {v2, v3}, Activity.onCreate(Bundle)V -> 6f 20 <m> 0032
        0x206F, m_super_oncreate, 0x0032,
        # new-instance v0, WebView -> 22 00 <t_webview>
        0x0022, t_webview,
        # invoke-direct {v0, v2}, WebView.<init>(Context)V -> 70 20 <m> 0020
        0x2070, m_wv_init, 0x0020,
        # invoke-virtual {v0}, WebView.getSettings() -> 6e 10 <m> 0000
        0x106E, m_wv_settings, 0x0000,
        # move-result-object v1 -> 0c 01
        0x010C,
        # const/4 v3, 1 -> 12 13
        0x1312,
        # invoke-virtual {v1, v3}, WebSettings.setJavaScriptEnabled(Z)V -> 6e 20 <m> 0031
        0x206E, m_js_enabled, 0x0031,
        # invoke-virtual {v1, v3}, WebSettings.setDomStorageEnabled(Z)V -> 6e 20 <m> 0031
        0x206E, m_dom_enabled, 0x0031,
        # invoke-virtual {v1, v3}, WebSettings.setDatabaseEnabled(Z)V -> 6e 20 <m> 0031
        0x206E, m_db_enabled, 0x0031,
        # invoke-virtual {v1, v3}, WebSettings.setAllowFileAccess(Z)V -> 6e 20 <m> 0031
        0x206E, m_file_access, 0x0031,
        # new-instance v1, WebViewClient -> 22 01 <t_wvc>
        0x0122, t_wvc,
        # invoke-direct {v1}, WebViewClient.<init>()V -> 70 10 <m> 0001
        0x1070, m_wvc_init, 0x0001,
        # invoke-virtual {v0, v1}, WebView.setWebViewClient(WebViewClient)V -> 6e 20 <m> 0010
        0x206E, m_set_wvc, 0x0010,
        # invoke-virtual {v2, v0}, Activity.setContentView(View)V -> 6e 20 <m> 0002
        0x206E, m_set_content, 0x0002,
        # const-string v1, "file:///android_asset/public/index.html" -> 1a 01 <s_url>
        0x011A, s_url,
        # invoke-virtual {v0, v1}, WebView.loadUrl(String)V -> 6e 20 <m> 0010
        0x206E, m_load_url, 0x0010,
        # return-void -> 0e 00
        0x000E,
    ]
    oncreate_insns = b"".join(struct.pack("<H", w) for w in insns_words)
    code_oncreate = (
        struct.pack("<HHHHII", 4, 2, 2, 0, 0, len(insns_words)) + oncreate_insns
    )

    # Layout calculation for DEX file
    header_size = 0x70
    string_ids_off = header_size
    type_ids_off = string_ids_off + len(strings) * 4
    proto_ids_off = type_ids_off + len(type_names) * 4
    method_ids_off = proto_ids_off + len(protos) * 12
    class_defs_off = method_ids_off + len(methods) * 8
    data_off = class_defs_off + 32  # 1 class_def (32 bytes)

    data = bytearray()

    def align4():
        while (data_off + len(data)) % 4 != 0:
            data.append(0)

    # 1. Type lists for protos with parameters
    proto_params_off = {}
    for i, p in enumerate(protos):
        params = p[2]
        if not params:
            proto_params_off[i] = 0
        else:
            align4()
            proto_params_off[i] = data_off + len(data)
            data.extend(struct.pack("<I", len(params)))
            for pt in params:
                data.extend(struct.pack("<H", t_idx[pt]))

    # 2. Code items (4-byte aligned)
    align4()
    code_init_off = data_off + len(data)
    data.extend(code_init)

    align4()
    code_oncreate_off = data_off + len(data)
    data.extend(code_oncreate)

    # 3. String data items
    string_data_offs = []
    for s in strings:
        string_data_offs.append(data_off + len(data))
        utf8 = s.encode("utf-8")
        data.extend(uleb128(len(s)))
        data.extend(utf8)
        data.append(0)

    # 4. Class data item for MainActivity
    class_data_off = data_off + len(data)
    m_main_init = m_idx[("Lcom/leadion/app/MainActivity;", "<init>", ("V", ()))]
    m_main_oncreate = m_idx[("Lcom/leadion/app/MainActivity;", "onCreate", ("V", ("Landroid/os/Bundle;",)))]

    class_data = (
        uleb128(0)  # static_fields_size
        + uleb128(0)  # instance_fields_size
        + uleb128(1)  # direct_methods_size (<init>)
        + uleb128(1)  # virtual_methods_size (onCreate)
        # direct method: <init> (PUBLIC | CONSTRUCTOR = 0x10001)
        + uleb128(m_main_init)
        + uleb128(0x10001)
        + uleb128(code_init_off)
        # virtual method: onCreate (PROTECTED = 0x0004)
        + uleb128(m_main_oncreate)
        + uleb128(0x0004)
        + uleb128(code_oncreate_off)
    )
    data.extend(class_data)

    # 5. Map list (4-byte aligned)
    align4()
    map_off = data_off + len(data)
    map_items = [
        (0x0000, 1, 0),  # HEADER_ITEM
        (0x0001, len(strings), string_ids_off),  # STRING_ID_ITEM
        (0x0002, len(type_names), type_ids_off),  # TYPE_ID_ITEM
        (0x0003, len(protos), proto_ids_off),  # PROTO_ID_ITEM
        (0x0005, len(methods), method_ids_off),  # METHOD_ID_ITEM
        (0x0006, 1, class_defs_off),  # CLASS_DEF_ITEM
        (0x1001, sum(1 for p in protos if p[2]), min(v for v in proto_params_off.values() if v > 0)),  # TYPE_LIST
        (0x2001, 2, code_init_off),  # CODE_ITEM
        (0x2002, len(strings), string_data_offs[0]),  # STRING_DATA_ITEM
        (0x2000, 1, class_data_off),  # CLASS_DATA_ITEM
        (0x1000, 1, map_off),  # MAP_LIST
    ]
    data.extend(struct.pack("<I", len(map_items)))
    for m_type, m_size, m_offset in map_items:
        data.extend(struct.pack("<HHII", m_type, 0, m_size, m_offset))

    file_size = data_off + len(data)
    data_size = len(data)

    # Assemble index tables
    string_ids_bytes = b"".join(struct.pack("<I", off) for off in string_data_offs)
    type_ids_bytes = b"".join(struct.pack("<I", s_idx[t]) for t in type_names)
    proto_ids_bytes = b"".join(
        struct.pack("<III", s_idx[p[0]], t_idx[p[1]], proto_params_off[i])
        for i, p in enumerate(protos)
    )
    method_ids_bytes = b"".join(
        struct.pack("<HHI", t_idx[m[0]], p_idx[m[1]], s_idx[m[2]])
        for m in methods
    )
    class_def_bytes = struct.pack(
        "<IIIIIIII",
        t_idx["Lcom/leadion/app/MainActivity;"],  # class_idx
        0x0001,  # PUBLIC
        t_idx["Landroid/app/Activity;"],  # superclass_idx
        0,  # interfaces_off
        0xFFFFFFFF,  # source_file_idx
        0,  # annotations_off
        class_data_off,  # class_data_off
        0,  # static_values_off
    )

    body_after_header = (
        string_ids_bytes
        + type_ids_bytes
        + proto_ids_bytes
        + method_ids_bytes
        + class_def_bytes
        + bytes(data)
    )

    header_tail = struct.pack(
        "<IIIIIIIIIIIIIIIIIIII",
        file_size,
        header_size,
        0x12345678,  # ENDIAN_CONSTANT
        0,  # link_size
        0,  # link_off
        map_off,
        len(strings),
        string_ids_off,
        len(type_names),
        type_ids_off,
        len(protos),
        proto_ids_off,
        0,  # field_ids_size
        0,  # field_ids_off
        len(methods),
        method_ids_off,
        1,  # class_defs_size
        class_defs_off,
        data_size,
        data_off,
    )

    sha1_digest = hashlib.sha1(header_tail + body_after_header).digest()
    adler = zlib.adler32(sha1_digest + header_tail + body_after_header) & 0xFFFFFFFF

    return b"dex\n035\x00" + struct.pack("<I", adler) + sha1_digest + header_tail + body_after_header


# ============================================================================
# 3. BINARY RESOURCES TABLE (resources.arsc)
# ============================================================================
def build_resources_arsc() -> bytes:
    # Minimal valid RES_TABLE_TYPE (0x0002) with empty global string pool
    sp = struct.pack("<HHIIIIII", 0x0001, 28, 28, 0, 0, 0, 28, 0)
    return struct.pack("<HHII", 0x0002, 12, 12 + len(sp), 0) + sp


# ============================================================================
# 4. CRYPTOGRAPHIC JAR / V1 APK SIGNING (MANIFEST.MF, CERT.SF, CERT.RSA)
# ============================================================================
def sign_apk_entries(entries: list[tuple[str, bytes, int]]) -> list[tuple[str, bytes, int]]:
    manifest_lines = [
        "Manifest-Version: 1.0",
        "Built-By: Leadion Android Builder",
        "Created-By: Leadion APK Compiler 1.0.0",
        "",
    ]

    for arcname, content, _ in entries:
        digest = base64.b64encode(hashlib.sha256(content).digest()).decode("ascii")
        manifest_lines.append(f"Name: {arcname}")
        manifest_lines.append(f"SHA-256-Digest: {digest}")
        manifest_lines.append("")

    manifest_bytes = "\r\n".join(manifest_lines).encode("utf-8")
    manifest_digest = base64.b64encode(hashlib.sha256(manifest_bytes).digest()).decode("ascii")

    sf_lines = [
        "Signature-Version: 1.0",
        f"SHA-256-Digest-Manifest: {manifest_digest}",
        "Created-By: Leadion APK Signer 1.0.0",
        "",
    ]

    for arcname, content, _ in entries:
        section = f"Name: {arcname}\r\nSHA-256-Digest: {base64.b64encode(hashlib.sha256(content).digest()).decode('ascii')}\r\n\r\n"
        sec_digest = base64.b64encode(hashlib.sha256(section.encode("utf-8")).digest()).decode("ascii")
        sf_lines.append(f"Name: {arcname}")
        sf_lines.append(f"SHA-256-Digest: {sec_digest}")
        sf_lines.append("")

    sf_bytes = "\r\n".join(sf_lines).encode("utf-8")

    # Generate RSA-2048 certificate and detached PKCS#7 DER signature via OpenSSL
    with tempfile.TemporaryDirectory() as tmpdir:
        key_path = os.path.join(tmpdir, "key.pem")
        cert_path = os.path.join(tmpdir, "cert.pem")
        sf_path = os.path.join(tmpdir, "CERT.SF")
        rsa_path = os.path.join(tmpdir, "CERT.RSA")

        with open(sf_path, "wb") as f:
            f.write(sf_bytes)

        subprocess.run(
            [
                "openssl",
                "req",
                "-x509",
                "-newkey",
                "rsa:2048",
                "-keyout",
                key_path,
                "-out",
                cert_path,
                "-days",
                "10000",
                "-nodes",
                "-subj",
                "/CN=Leadion Mobile/OU=Mobile/O=Leadion/L=Maputo/C=MZ",
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        subprocess.run(
            [
                "openssl",
                "smime",
                "-sign",
                "-in",
                sf_path,
                "-signer",
                cert_path,
                "-inkey",
                key_path,
                "-outform",
                "DER",
                "-binary",
                "-noattr",
                "-out",
                rsa_path,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        with open(rsa_path, "rb") as f:
            rsa_bytes = f.read()

    meta_entries = [
        ("META-INF/MANIFEST.MF", manifest_bytes, zipfile.ZIP_DEFLATED),
        ("META-INF/CERT.SF", sf_bytes, zipfile.ZIP_DEFLATED),
        ("META-INF/CERT.RSA", rsa_bytes, zipfile.ZIP_DEFLATED),
    ]
    return entries + meta_entries


def build_apk(root_dir: Path, out_apk_paths: list[Path]):
    dist_dir = root_dir / "dist"
    if not dist_dir.exists():
        raise RuntimeError("Directory 'dist' not found. Run 'npm run build' first.")

    entries: list[tuple[str, bytes, int]] = []

    # 1. Binary AndroidManifest.xml
    manifest_bin = build_axml_manifest()
    entries.append(("AndroidManifest.xml", manifest_bin, zipfile.ZIP_DEFLATED))

    # 2. Binary classes.dex
    dex_bin = build_classes_dex()
    entries.append(("classes.dex", dex_bin, zipfile.ZIP_DEFLATED))

    # 3. Binary resources.arsc (MUST be STORED uncompressed in Android APKs)
    arsc_bin = build_resources_arsc()
    entries.append(("resources.arsc", arsc_bin, zipfile.ZIP_STORED))

    # 4. Android launcher icons from android/app/src/main/res/mipmap-*
    res_root = root_dir / "android" / "app" / "src" / "main" / "res"
    if res_root.exists():
        for p in sorted(res_root.rglob("*.png")):
            rel = p.relative_to(res_root).as_posix()
            entries.append((f"res/{rel}", p.read_bytes(), zipfile.ZIP_STORED))

    # 5. Capacitor config in assets/capacitor.config.json
    cap_cfg = root_dir / "android" / "app" / "src" / "main" / "assets" / "capacitor.config.json"
    if cap_cfg.exists():
        entries.append(("assets/capacitor.config.json", cap_cfg.read_bytes(), zipfile.ZIP_DEFLATED))

    # 6. Compiled web bundle from dist/ into assets/public/ (excluding the APK itself to avoid recursion!)
    for p in sorted(dist_dir.rglob("*")):
        if p.is_file() and not p.name.endswith(".apk"):
            rel = p.relative_to(dist_dir).as_posix()
            entries.append((f"assets/public/{rel}", p.read_bytes(), zipfile.ZIP_DEFLATED))

    # Sign all entries with V1 JAR signature (MANIFEST.MF, CERT.SF, CERT.RSA)
    all_entries = sign_apk_entries(entries)

    # Write APK archive
    for out_path in out_apk_paths:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(out_path, "w") as zf:
            for arcname, content, compress_type in all_entries:
                zinfo = zipfile.ZipInfo(filename=arcname, date_time=(2026, 9, 26, 12, 0, 0))
                zinfo.compress_type = compress_type
                zinfo.external_attr = 0o644 << 16
                zf.writestr(zinfo, content)

        size_kb = out_path.stat().st_size / 1024
        print(f"✅ APK gerado e assinado com sucesso: {out_path} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    workspace = Path(__file__).resolve().parent.parent
    targets = [
        workspace / "public" / "leadion-android.apk",
        workspace / "dist" / "leadion-android.apk",
        workspace / "android" / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk",
    ]
    build_apk(workspace, targets)
