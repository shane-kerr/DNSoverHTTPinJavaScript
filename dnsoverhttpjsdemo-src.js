/*
    DNS over HTTP JavaScript test by Shane Kerr
    Copyright (C) 2016  Beijing Internet Institute (BII) Labs

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var packet = require('native-dns-packet'),
    Buffer = require('buffer').Buffer;

// test if a given hostname is valid
function isValidHostname(name)
{
    // special case root
    if (name == ".") {
        return true;
    }

    // otherwise use the rules here:
    // http://en.wikipedia.org/wiki/Hostname#Restrictions_on_valid_host_names
    if ((name.length <= 0) || (name.length > 255)) {
        return false;
    }
    labels = name.split('.');
    for (i in labels)
    {
        if ((labels[i].length < 1) || (labels[i].length > 63)) {
            return false;
        }
        if (!labels[i].match(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/)) {
            return false;
        }
    }
    return true;
}

//debugger;

function qnameColor()
{
    var theForm;
    theForm = document.dnslookup;
   
    // color the input depending on its validity
    if (isValidHostname(theForm.qname.value)) {
        document.getElementById("qname").style.color = "black";
    } else {
        document.getElementById("qname").style.color = "gray";
    }
}

// set the input button based on the value of the fields
function generateCheck()
{
    var theForm;
    theForm = document.dnslookup;

    if (isValidHostname(theForm.qname.value)) {
        theForm.cmdDNSoverHTTP.disabled = 0;
    } else {
        theForm.cmdDNSoverHTTP.disabled = 1;
    }
}

code2class = {
    1: 'IN',
    3: 'CH',
}

code2opcode = {
    0: 'Query',
    1: 'IQuery',
    2: 'Status',
    4: 'Notify',
    5: 'Update',
}

// based on this:
// http://sajjadhossain.com/2008/10/31/javascript-string-trimming-and-padding/
// improved to truncate on multi-character padding strings
String.prototype.rpad = function(padString, length) 
{
    var str = this;
    while (str.length < length) {
        str = str + padString;
    }
    return str.substring(0, length)
}

// based on this:
// http://sajjadhossain.com/2008/10/31/javascript-string-trimming-and-padding/
// improved to truncate on multi-character padding strings
String.prototype.lpad = function(padString, length) 
{
    var str = this;
    while (str.length < length) {
        str = padString + str;
    }
    return str.substring(0, length)
}

function printUnknownRR(data)
{
    var txt = "";

    txt += "\\# " + data.length + " ";
    for (var i=0; i<data.length; i++) {
        txt += data.buffer[i].toString(16).lpad("0", 2);
    }
    return txt;
}

function printSection(section)
{
    var txt = "";
    var i;

    // find longest label
    ownername_lengths = [];
    for (i=0; i<section.length; i++) {
        ownername_lengths[i] = section[i].name.length;
    }
    ownername_width = Math.max.apply(null, ownername_lengths);

    // output each resource record
    for (i=0; i<section.length; i++) {
        rr = section[i];
        console.log(rr);
        txt += rr.name.rpad(" ", ownername_width) + "  ";
	txt += rr.ttl.toString().lpad(6) + "  " + code2class[rr.class] + "  ";
	txt += packet.consts.qtypeToName(rr.type) + "  ";
	if (rr.type == packet.consts.nameToQtype('A')) {
	    txt += '"' + rr.address + '"';
	} else if (rr.type == packet.consts.nameToQtype('AAAA')) {
	    txt += '"' + rr.address + '"';
	} else if (rr.type == packet.consts.nameToQtype('SOA')) {
	    txt += rr.primary + " " + rr.admin + " (\n";
	    txt += "                                ";
	    txt += rr.serial.toString().rpad(" ", 10) + " ; serial\n";
	    txt += "                                ";
	    txt += rr.refresh.toString().rpad(" ", 10) + " ; refresh\n";
	    txt += "                                ";
	    txt += rr.retry.toString().rpad(" ", 10) + " ; retry\n";
	    txt += "                                ";
	    txt += rr.expiration.toString().rpad(" ", 10) + " ; expire\n";
	    txt += "                                ";
	    txt += rr.minimum.toString().rpad(" ", 10) + " ; negative TTL\n";
	    txt += "                                )";
	} else if (rr.type == packet.consts.nameToQtype('MX')) {
            txt += rr.priority + " " + rr.exchange;
	} else if (rr.type == packet.consts.nameToQtype('RRSIG')) {
	    txt += printUnknownRR(rr.data);
	} else if (rr.type == packet.consts.nameToQtype('NSEC')) {
	    txt += printUnknownRR(rr.data);
	} else if (rr.type == packet.consts.nameToQtype('NSEC3')) {
	    txt += printUnknownRR(rr.data);
	} else if (rr.type == packet.consts.nameToQtype('DNSKEY')) {
	    txt += printUnknownRR(rr.data);
	} else if (rr.type == packet.consts.nameToQtype('NSEC3PARAM')) {
	    txt += printUnknownRR(rr.data);
	} else if (rr.hasOwnProperty('data')) {
	    txt += '"' + rr.data + '"';
	}
	txt += "\n";
    }
    return txt;
}

function printDNSreply(ans) 
{
    var txt = "";
    txt += "Header\n";
    txt += "===========================\n";
    txt += "      id: " + ans.header.id + "\n";
    txt += "      qr: " + ans.header.qr + "\n";
    txt += "  opcode: " + ans.header.opcode + " (" + code2opcode[ans.header.opcode] + ")\n";
    txt += "      aa: " + ans.header.aa + "\n";
    txt += "      tc: " + ans.header.tc + "\n";
    txt += "      rd: " + ans.header.rd + "\n";
    txt += "      ra: " + ans.header.ra + "\n";
    txt += "   rcode: " + ans.header.rcode + " (" + packet.consts.RCODE_TO_NAME[ans.header.rcode] + ")\n";
    txt += "\n";
    if (ans.answer.length > 0) {
        txt += "Answers\n";
        txt += "===========================\n";
        txt += printSection(ans.answer);
        txt += "\n";
    }
    if (ans.authority.length > 0) {
        txt += "Authority\n";
        txt += "===========================\n";
        txt += printSection(ans.authority);
        txt += "\n";
    }
    // remove the OPT record from the additional section
    filtered_additional = [];
    for (i=0, j=0; i<ans.additional.length; i++) {
        if (ans.additional[i].type != packet.consts.NAME_TO_QTYPE.OPT) {
		filtered_additional[j++] = ans.additional[i];
	}
    }
    if (filtered_additional.length > 0) {
        txt += "Additional\n";
        txt += "===========================\n";
        txt += printSection(filtered_additional);
        txt += "\n";
    }
    document.getElementById("result").innerHTML = txt;
}

function DNSoverHTTPform()
{
    pkt = Object();

    // fill in header (names found in parseHeader in packet.js)
    pkt.header = Object();
    var id_array = new Uint16Array(1);
    window.crypto.getRandomValues(id_array);
    pkt.header.id = id_array[0];
    pkt.header.qr = 0;		// we are a query (not a response)
    pkt.header.opcode = 0;	// our opcode type is QUERY
    pkt.header.aa = 0;
    pkt.header.tc = 0;
    pkt.header.rd = 1;
    pkt.header.ra = 0;
    pkt.header.res1 = 0;
    pkt.header.res2 = 0;
    pkt.header.res3 = 0;
    pkt.header.rcode = 0;

    var theForm;
    theForm = document.dnslookup;

    question = Object();
    question.name = theForm.qname.value;
    if (question.name == ".") {
        question.name = "";
    }
    question.type = theForm.qtype.value;
    question.class = theForm.qclass.value;

    pkt.question = [question,];
    pkt.answer = [];
    pkt.authority = [];
    pkt.additional = [];

    if (theForm.DO.checked) {
    	// use our own EDNS because the one in native-dns-packet is not fully-featured
	packet.edns = {
            name: '',
	    type: packet.consts.NAME_TO_QTYPE.OPT,
	    class: 65535,		// UDP payload size - not used by us
	    ttl: (1 << 15),		// extended RCODE and flags - set DO bit
            options: [],
	};
	pkt.additional.push(packet.edns);
    }

    buff = Buffer.alloc(65536);
    msg_len = packet.write(buff, pkt);
    msg = Buffer.alloc(msg_len);
    buff.copy(msg, 0, 0, msg_len);

    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () { 
        if (xhttp.readyState == 4) {
    	    if (xhttp.status == 200) {
	        ans_buff = Buffer.from(xhttp.response);
	        ans = packet.parse(ans_buff);
		printDNSreply(ans)
	    } else {
	        window.alert("Non-success status: " + xhttp.status)
	    }
        }
    }
    xhttp.open("POST", "/.well-known/dns-wireformat", true);
    xhttp.setRequestHeader("X-Proxy-DNS-Transport", "TCP");
    xhttp.setRequestHeader("Content-Type", "application/octet-stream");
    xhttp.responseType = 'arraybuffer';
    xhttp.send(msg);
}

document.getElementById("qname").onkeyup = function (e) { qnameColor(); generateCheck(); };
document.getElementById("qtype").onchange = function (e) { generateCheck(); };
document.getElementById("qclass").onchange = function (e) { generateCheck(); };
document.getElementById("cmdDNSoverHTTP").onclick = function (e) { DNSoverHTTPform(); };

