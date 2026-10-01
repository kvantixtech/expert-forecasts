//rewrite eval using closures
function __fixEval() {
    var oEval = eval;
    var m = /^'?"?\s*function\s*\(/m;
    eval = function (jCode) {
        if (typeof (jCode) == 'function') return jCode;
        if (m.test(jCode)) {
            return oEval('(function(){return ' + jCode + ';})()');
        }
        return oEval(jCode);
    }
}


var isFireFox = navigator.userAgent.indexOf("Firefox") != -1;
var isChrome = navigator.userAgent.indexOf("Chrome") != -1;
var isIE9 = navigator.userAgent.indexOf("MSIE 9.0") != -1;
var isIE10 = navigator.userAgent.indexOf("MSIE 10.0") != -1;
var isIE11 = navigator.userAgent.indexOf("Trident/7.0") != -1;
if (isChrome || isFireFox || isIE9 || isIE10 || isIE11) __fixEval();


var SelectListTimer = null;

var minYFileOpload = null;
var minXFileOpload = null;
var maxYFileOpload = null;
var maxXFileOpload = null;
var dummyFileopload = null;
var tmpFunFileOpload = null;
var formFileOpload = null;


//optional prevent backspace from going back in browserhistory on certain elements
if (typeof window.event == 'undefined') {
    document.onkeypress = function (e) {
        var n = e.target;
        if (e.keyCode == 8 && n && n.id && n.id.length > 0 && MR.IdValue.get(n.id, 'nobackspace')) {
            e.preventDefault();
        }
    }
} else {
    document.onkeydown = function () {
        var n = event.srcElement;
        if (event.keyCode == 8 && n && n.id && n.id.length > 0 && MR.IdValue.get(n.id, 'nobackspace'))
            event.returnValue = false;
    }
}



/****h* /MR
* NAME 
* MR
*
* DESCRIPTION
*  Pseudo namespace for the MonoRail javascript library.
*
*
****/
var MR = new Object();

/** container for various constants */
MR.Constants = {
    /** background colour for the position marker in dropdown boxes */
    selectBoxBgColor: '#ffef99',

    /** One of two colours used in the calendar datepicker */
    CalOnMouseColor1: '#5577ff',

    /** One of two colours used in the calendar datepicker */
    CalOnMouseColor2: '#ff77ff',

    shadowLeft: 5,

    shadowTop: 7
}

/****h* MR/Controls
* NAME  
*  Controls
*
* DESCRIPTION
*  Array of arrays of request objects. Each request ID, generated via MR/Request initiations, represents an array with the sequence of sent requests for that ID.
*
****/
MR.Controls = new Array();
/* list of ID's and the corresponding methods to be executed when their "onChange" "event is triggered */
MR.Controls.onChange = new Array();
/* z-stack array, primarily intended for dhtml-windows*/
MR.Controls.zStack = new Array();

/****v* Controls/MonoRails
* NAME
*  MonoRails
*
* DESCRIPTION
*  Array of arrays of request objects. Each request ID generated via MR/Request calls represents an array with the sequence of sent requests for that ID.
*
****/
MR.Controls.MonoRails = new Array();

MR.Controls.MonoRails.fileUploads =
{
    emtpy: 0
}

MR.IdValue =
{
    /****m* Controls/getElement
    * NAME
    *  getElement
    *
    * DESCRIPTION
    * Returns an object representing the context identified by AelementId
    *
    * USAGE
    * MR.IdValue.getElement(string AelementId);
    *
    ****/
    getElement: function (AelementId) {
        if (!MR.Controls._idValueCollections) {
            MR.Controls._idValueCollections = new Object();
        }
        if (!MR.Controls._idValueCollections[AelementId]) {
            MR.Controls._idValueCollections[AelementId] = new Object();
        }
        return MR.Controls._idValueCollections[AelementId];
    },

    /****m* IdValue/clearElement
    * NAME
    *  clearElement
    *
    * DESCRIPTION
    * Clears the list state identified by AelementId
    *
    * USAGE
    * MR.IdValue.clearElement(string AelementId);
    *
    ****/
    clearElement: function (AelementId) {
        MR.Controls._idValueCollections[AelementId] = undefined;
    },

    /****m* IdValue/setOrderBy
    * NAME
    *  setOrderBy
    *
    * DESCRIPTION
    * Sets sorting to a specified column in a specified gridcontext
    *
    * USAGE
    * MR.IdValue.setOrderBy(string AelementId, string AsortColumn);
    *
    ****/

    setOrderBy: function (AelementId, AsortColumn) {
        var state = MR.IdValue.getElement(AelementId);

        if (state.columnName == AsortColumn) {
            state.direction =
            state.direction == "asc" ? "desc" : "asc";
        }
        else {
            state.columnName = AsortColumn;
            state.direction = "asc";
        }
    },

    /****m* IdValue/getOrderBy
    * NAME
    *  MonoRails
    *
    * DESCRIPTION
    * Gets the sorting column and direction for a given context
    *
    * USAGE
    * MR.IdValue.getOrderBy(string contexid);
    *
    ****/
    getOrderBy: function (AelementId) {
        var state = MR.IdValue.getElement(AelementId);

        if (state.columnName)
            return state.columnName + " " +
                    state.direction;
        else
            return undefined;
    },

    /****m* IdVal/get
    * NAME
    *  get 
    *
    * DESCRIPTION
    * Gets gets a named value from a context identified by AelementId.
    *
    * USAGE
    * MR.IdValue.get (string AelementId, string Aname);
    *
    ****/
    get: function (AelementId, Aname) {
        return MR.IdValue.getElement(AelementId)[Aname];
    },

    /****m* IdVal/set
    * NAME
    *  set
    *
    * DESCRIPTION
    * Sets the a named value in a ElementIdValue identified by AelementId.
    *
    * USAGE
    * MR.IdValue.get(string AelementId, string Aname, var Avalue);
    *
    ****/
    set: function (AelementId, Aname, Avalue) {
        MR.IdValue.getElement(AelementId)[Aname] = Avalue;
    }
}

/** A supplementary function for detecting if an htmlNode has a certain attribute (since IE doesn't have it in its DOM implementaion...)
@param Aobj The node object to be tested.
@param Aname The attribute name to test for.
@returns true if the htmlNode has the attribute set, otherwise false
@private 
*/
function _hasAttribute(Aobj, Aname) {
    if (Aobj.attributes) {
        for (var i = 0; i < Aobj.attributes.length; i++) {
            if (Aobj.attributes[i].nodeName.indexOf(Aname) == 0)
                return true;
        }
        return false;
    }
    else
        return false;
}

/** Method  that sets up and performs an XMLHttpRequest

@param Aurl Url of the webservice to call (ie. Services.asmx).
@param Aid The identifier that the request object will be stored under in the MonoRails[] array, this is important since there is a system of request sequence handling built built into this function that discards all responses that don't have an "reqSeqId" value equal of the latest sent request.
@param AsoapXMLobject An {@link SOAPrequest} instance.
@param AoptHndleFunc is an optional requestresponse handler function, defaults to {@link #_handlecbAJAX} if no value is supplied.

@requires SOAPrequest SOAPrequest instance that holds a well formed XML request to send.
*/
function mrAJAXrequest(AsoapXMLobject) {

    var Aurl = AsoapXMLobject.URL;
    var Aid = AsoapXMLobject.ID;

    if (!MR.Controls.MonoRails[Aid])
        MR.Controls.MonoRails[Aid] = new Array();

    //we have to use sequence ID's
    if (!MR.Controls.MonoRails[Aid]['reqSeqID'] || MR.Controls.MonoRails[Aid]['reqSeqID'] < 1) {
        MR.Controls.MonoRails[Aid]['reqSeqID'] = 1;
    }
    else
        MR.Controls.MonoRails[Aid]['reqSeqID']++;

    var Wii = MR.Controls.MonoRails[Aid]['reqSeqID'];

    //try to see if the current request is already created
    if (!MR.Controls.MonoRails[Aid]['req'])
        MR.Controls.MonoRails[Aid]['req'] = new Array();

    // branch for native XMLHttpRequest object
    if (window.XMLHttpRequest) {
        try {
            MR.Controls.MonoRails[Aid]['req'][Wii] = new XMLHttpRequest();
        }
        catch (e) {
            MR.Controls.MonoRails[Aid]['req'][Wii] = false;
        }
        // branch for IE/Windows ActiveX version
    }
    else
        if (window.ActiveXObject) {
            try {
                MR.Controls.MonoRails[Aid]['req'][Wii] = new window.ActiveXObject("Msxml2.XMLHTTP");
            }
            catch (e) {
                try {
                    MR.Controls.MonoRails[Aid]['req'][Wii] = new window.ActiveXObject("Microsoft.XMLHTTP");
                }
                catch (e) {
                    MR.Controls.MonoRails[Aid]['req'][Wii] = false;
                }
            }
        }
    //set the responsehandler function
    if (MR.Controls.MonoRails[Aid]['req'][Wii]) {
        MR.Controls.MonoRails[Aid]['processReqChange'] = function () {
            // MR might be unloaded before the response appears
            if (typeof (MR) != 'object') return;

            // only if req shows "loaded"
            if (MR.Controls.MonoRails[Aid.toString()]['req'][Wii.toString()].readyState == 4) {
                // only if "OK"
                if (MR.Controls.MonoRails[Aid.toString()]['req'][Wii.toString()].status == 200) {
                    //first check the sequence number
                    var WreqSecId = MR.Controls.MonoRails[Aid]['req'][Wii.toString()].responseXML.getElementsByTagName("reqSeqID")[0];
                    if (WreqSecId) {
                        WreqSecId = WreqSecId.textContent ? WreqSecId.textContent : WreqSecId.text;

                        //todo her skal skrives evaluerende kode for om der er en kø der skal laves requests fra
                        warr = MR.IdValue.get('MR_Interactive_call', "queue");
                        if (warr != undefined && warr[0].ID == Aid && warr[0]['seqId'] == Wii)
                            mrAJAXrequest(warr.pop());


                        if (WreqSecId != MR.Controls.MonoRails[Aid]['reqSeqID']) {
                            //pass the request result object over to the garbage collector and exit
                            MR.Controls.MonoRails[Aid]["req"][WreqSecId] = false;
                            return;
                        }

                        if (MR.Controls.MonoRails[Aid.toString()]['optHndleFunc'])
                            AoptHndleFunc(MR.Controls.MonoRails[Aid]);
                        else
                            _handlecbAJAX(MR.Controls.MonoRails[Aid]);

                        //pass the request result object over to the garbage collector	
                        MR.Controls.MonoRails[Aid]["req"][WreqSecId] = false;
                    }
                    else
                        MonorailErrorFunc("Intern fejl. WreqSecId=null");

                }
                    //if not "OK"
                else {
                    Woutstr = "httprequest error\n"
                    Woutstr += "Errorcode: " + MR.Controls.MonoRails[Aid.toString()]['req'][Wii].status + "\n";
                    Woutstr += "statusText: " + MR.Controls.MonoRails[Aid.toString()]['req'][Wii].statusText + "\n";
                    MonorailErrorFunc(Woutstr);
                }
            }
        }
        //insert reqSeqID
        AsoapXMLobject.addArg("reqSeqID", Wii);

        //set interactive status
        AsoapXMLobject.addArg("MR_interactive", AsoapXMLobject.interactive.toString());

        if (AsoapXMLobject.optHndleFunc)
            MR.Controls.MonoRails[Aid]['optHndleFunc'] = AsoapXMLobject.optHndleFunc;
        MR.Controls.MonoRails[Aid]['_id'] = Aid;
        MR.Controls.MonoRails[Aid]['req'][Wii].onreadystatechange = MR.Controls.MonoRails[Aid]['processReqChange'];
        MR.Controls.MonoRails[Aid]['req'][Wii].open('POST', Aurl, true);
        MR.Controls.MonoRails[Aid]['req'][Wii].setRequestHeader('Content-Type', 'text/xml; charset=utf-8');
        MR.Controls.MonoRails[Aid]['req'][Wii].setRequestHeader('SOAPAction', 'http://MonoRail.carlbro.dk/' + AsoapXMLobject.WebMethodName);
        var wReqStr = AsoapXMLobject.stringify();
        MR.Controls.MonoRails[Aid]['req'][Wii].setRequestHeader('Length', wReqStr.length);


        if (!AsoapXMLobject.interactive)
            MR.Controls.MonoRails[Aid]['req'][Wii].send(wReqStr);
        else {
            if (!MR.IdValue.get('MR_Interactive_call', 'blocked')) {
                //todo her skal skrives identificerende kode for det blokkende kald.
                MR.IdValue.set('MR_Interactive_call', 'blocked', AsoapXMLobject.interactive ? undefined : { 'ID': AsoapXMLobject.ID, 'seqID': Wii });
                MR.Controls.MonoRails[Aid]['req'][Wii].send(wReqStr);
            }
            else {
                if (!MR.IdValue.get('MR_Interactive_call', 'queue')) {
                    wqa = Array();
                    wqa.push(AsoapXMLobject);

                    MR.IdValue.set('MR_Interactive_call', 'queue', wqa);
                }
                else {
                    var warr = MR.IdValue.get('MR_Interactive_call', "queue");
                    for (qe in warr) {
                        if (AsoapXMLobject['ID'] == warr[qe]['ID'] &&
                            AsoapXMLobject['WebMethodName'] == warr[qe]['WebMethodName'] &&
                            AsoapXMLobject['URL'] == warr[qe]['URL']) {
                            warr.splice(qe, 1);
                            warr.push(AsoapXMLobject);
                            MR.Controls.MonoRails[Aid]['req'][warr[qe].dTree.getElementsByTagName('reqSeqID')[0].text] = undefined;
                            break;
                        }
                        warr.push(AsoapXMLobject);
                    }
                }
            }
        }
    }
}


// ovveride this funtion if you want special error handling
function MonorailErrorFunc(ErrorText) {
    alert(ErrorText);
}

/**
Default responsehandler method for the {@link #mrAJAXrequest} method, its flagged "private", but its good to have a look at it if you want write your own custom response handler method.
@private
@param AcbReq {@link #mrAJAXrequest} calls the responsehandler method with a reference to the part of MonoRails[] array that holds, among other things, the XMLHttpRequest object that contains the answer from the server.
*/
function _handlecbAJAX(AcbReq) {
    WreqSeqID = AcbReq.reqSeqID;

    //html insertion
    var insertion = AcbReq['req'][WreqSeqID].responseXML.getElementsByTagName("insertion")[0];
    //insertion = insertion.textContent?insertion.textContent:insertion.text;
    insertion = typeof (insertion.textContent) == 'string' ? insertion.textContent : insertion.text;

    if (insertion && insertion.length > 0 && insertion.indexOf('noInsertion') != 0) {
        if (insertion.indexOf(':') == -1)
            insertion = "append:" + insertion;
        var Wtarget = eval(insertion.split(':')[1]);

        var WtoBeInserted = document.createElement("div");
        var WinnerHTML = AcbReq['req'][WreqSeqID]['responseXML'].getElementsByTagName('html')[0];
        if (WinnerHTML.xml) {
            WinnerHTML = WinnerHTML.xml;
            WtoBeInserted.innerHTML = WinnerHTML;
        }

        else {
            WtoBeInserted = document.createElement(WinnerHTML.firstChild.nodeName);
            var XML2HTML = function (Acur, Ainto) {
                for (var i = 0; i < Acur.childNodes.length; i++) {
                    switch (Acur.childNodes[i].nodeName) {
                        case "#text":
                            Ainto.appendChild(document.createTextNode(Acur.childNodes[i].nodeValue));
                            break;

                        default:

                            var WnewNode = document.createElement(Acur.childNodes[i].nodeName);
                            if (Acur.childNodes[i].attributes && Acur.childNodes[i].attributes.length > 0) {
                                for (var j = 0; j < Acur.childNodes[i].attributes.length; j++) {
                                    var Wnv = Acur.childNodes[i].attributes[j].nodeValue;
                                    var Wn = Acur.childNodes[i].attributes[j].nodeName;

                                    switch (Wn) {
                                        case 'class':
                                            WnewNode.className = Wnv;
                                            break;
                                        case 'style':

                                            try {
                                                WnewNode.style.setAttribute('cssText', Wnv);
                                            }
                                            catch (e) {
                                                WnewNode.setAttribute('style', Wnv);
                                            }
                                            break;
                                            /*                                    case 'for' :
                                                                                    WnewNode.setAttribute('htmlFor', Wnv)
                                                                                break;
                                            */
                                        default:
                                            WnewNode.setAttribute(Wn, Wnv);
                                            break;
                                    }
                                }
                            }
                            Ainto.appendChild(WnewNode);

                            if (Acur.childNodes[i].childNodes.length > 0)
                                XML2HTML(Acur.childNodes[i], Ainto.lastChild)
                            break;
                    }
                }
            }
            if (WinnerHTML.childNodes.length > 0)
                XML2HTML(WinnerHTML, WtoBeInserted);
        }
    }

    //preinsertion code
    var Wpic = AcbReq['req'][WreqSeqID]['responseXML'].getElementsByTagName('preinsertioncode')[0];
    eval(Wpic.textContent ? Wpic.textContent : Wpic.text);

    //if (insertion.indexOf('noInsertion') == 0)
    //    return;
    if (insertion && insertion.indexOf('noInsertion') == 0)
        return;

    //if Wtarget isn't set abort
    if (!Wtarget) {
        if (MR.IdValue.get('debugging', 'enabled'))
            alert("Der opstod en element indsættelses fejl. Indsættelseskommandoen '" + insertion + "' kunne ikke udføres.");
        return;
    }

    if (insertion.indexOf("replace:") == 0) {
        var WoldClass = (Wtarget.className ? Wtarget.className : '');
        if (WoldClass.length > 0 && WtoBeInserted.firstChild.className.length == 0) {
            WtoBeInserted.firstChild.setAttribute("class", WoldClass);
            WtoBeInserted.firstChild.className = WoldClass;
        }

        var WoldDisp = WtoBeInserted.firstChild.style.display;
        WtoBeInserted.firstChild.style.display = 'none';
        Wtarget.parentNode.replaceChild(WtoBeInserted.firstChild, Wtarget);
        eval(insertion.split(':')[1]).style.display = WoldDisp;
    }
    else if (insertion.indexOf('append:') == 0) {
        for (var i = 0; i < WtoBeInserted.childNodes.length; i++) {
            Wtarget.appendChild(WtoBeInserted.childNodes[i].cloneNode(true));
        }
    }
    else if (insertion.indexOf('insertBefore') == 0) {
        for (var i = 0; i < WtoBeInserted.childNodes.length; i++) {
            Wtarget.parentNode.insertBefore(WtoBeInserted.childNodes[i].cloneNode(true), Wtarget);
        }
    }


    //add eventhandlers
    var eventHandlers = AcbReq['req'][WreqSeqID]['responseXML'].getElementsByTagName('script');

    for (var i = 0; i < eventHandlers.length; i++) {
        if (_hasAttribute(eventHandlers[i], "eventtype")) {
            var Wev = eventHandlers[i].textContent ? eventHandlers[i].textContent : eventHandlers[i].text;
            MR.Events.handler.add(eventHandlers[i].getAttribute('toid'), eventHandlers[i].getAttribute('eventtype'), Wev, eventHandlers[i].getAttribute('stopBubble') == "true");
        }

        else {
            var WtmpScript = eventHandlers[i].textContent ? eventHandlers[i].textContent : eventHandlers[i].text;
            eval(String(WtmpScript));
        }
    }
    //post insertion code
    var Wposic = AcbReq['req'][WreqSeqID]['responseXML'].getElementsByTagName('postinsertioncode')[0];
    eval(Wposic.textContent || Wposic.text);
}

/** cross browser version of W3 DOM addEventListener method
@param AtrgtElement Either the element object itself or a string with the elements ID
@param AeventType String describing the event type that triggers the event (ie. "click", "mouseover", "mousedown" etc.)
@param AeventCode Either a method object (method name without the trailing '()') or an inline method declaration (ie. "function(){alert('I am a real method!');}")
*/
function _addEventHandler(AtrgtElement, AeventType, AeventCode, AstopBubble) {
    AeventType = AeventType.split(";");

    var Welement;
    if (typeof AtrgtElement == "string")
        Welement = MR.getId(AtrgtElement);
    else
        Welement = AtrgtElement;

    if (Welement) {
        if (document.addEventListener) {
            for (i = 0; i < AeventType.length; i++)
                Welement.addEventListener(AeventType[i], eval(AeventCode), (AstopBubble === true ? true : false));
        }
        else if (document.attachEvent) {
            for (i = 0; i < AeventType.length; i++) {
                var WeFunc;
                if (typeof AeventCode == "function")
                    WeFunc = AeventCode;

                else if (typeof AeventCode == "string") {
                    var WregExp = new RegExp("\{(.*)\}(?! \})", "m");
                    WeFunc = new Function(WregExp.exec(AeventCode)[1]);
                }
                //WeFunc = eval(AeventCode);
                Welement.attachEvent('on' + AeventType[i], WeFunc);
            }
        }
    }
}

/** cross browser version of W3 DOM removeEventListener 
@param Afromid A string with the elements ID
@param AeventType String describing the event type that triggers the event (ie. "click", "mouseover", "mousedown" etc.)
@param AeventCode Either a method object (method name without the trailing '()') or an inline method declaration (ie. "function(){alert('I am a real method!');
*/
function _removeEventHandler(AtrgtElement, AeventType, AeventCode, AstopBubble) {
    var Welement;
    if (typeof AtrgtElement == "string")
        Welement = MR.getId(AtrgtElement);
    else
        Welement = AtrgtElement;

    if (document.removeEventListener) {
        Welement.removeEventListener(AeventType, eval(AeventCode), (AstopBubble === true ? true : false));
    }

    else if (document.detachEvent) {
        Welement.detachEvent('on' + AeventType, AeventCode);
    }
}


/** 
returns an SOAPrequest object, you can add further parameters to the request with the {@link #addArg} 
method or mass-import html inputdata from sections of the running page with the {@link #insertPageInputs} method.
@param WebMethodName The name of the webmethod to be called.
@returns A SOAPrequest object for use in the {@link GLOBALS#mrAJAXrequest} function.
*/


/****c* MR/Request
* NAME 
*  Request
*
* DESCRIPTION
*	Constructs a Request object, you can add further parameters to the request with the MR/Request/addArg 
*	method or mass-import html inputdata from sections of the running page with the insertPageInputs method.
*
* USAGE 
* var WnewRequest = new MR.Request(string AwebMethodName, string Aid, string Aurl, function [, AoptHndleFunc[, aInteractive]]);
*
* ARGUMENTS
* * AwebMethodName -- Name of the webmtehod to be called on the server
* * Aid -- Unique ID for this request type. Requests with the same ID are placed in a que ( MR/Controls/MonoRails ) where only the response that 
*   corresponds to the request that was sent last gets handled on the client. Uniqueify these ID's if the all responses must be handled. 
* * Aurl -- Base URL of the file on the server that should handle this webservice call (ie. "Services.asmx").
*
* OPTIONS
* * AoptHndleFunc -- Optional alternate function for handling the request, the function gets passed the responseobject.
* * 
*
* RETURN VALUE
* A Request object.
*
* SEE ALSO
*  Request/submit() 
*
******/
MR.Request = function (AwebMethodName, Aid, Aurl, AoptHndleFunc, aInteractive) {
    if (Aid)
        this.ID = Aid;
    else {
        alert('MR.Request initiated without webmethod queue id');
        return;
    }
    if (Aurl)
        this.URL = Aurl;
    else {
        alert('MR.Request initiated without sequence id');
        return;
    }
    if (AoptHndleFunc)
        this.optHndleFunc = AoptHndleFunc;
    else
        this.optHndleFunc = false;

    this.interactive = aInteractive || true;

    /****m* Request/submit
    * NAME
    * submit
    *
    * USAGE
    * MR.Request.submit()
    *
    * DESCRIPTION
    * Submit the request object
    *
    /******/
    this.submit = function () {
        mrAJAXrequest(this, (this.optHndleFunc ? this.optHndleFunc : false));
    }
    this.defResponseHandler = _handlecbAJAX;

    if (!AwebMethodName || AwebMethodName.Lenght == 0) {
        alert("You need to supply a method name for the soap request!");
        return;
    }
    this.WebMethodName = AwebMethodName;


    //IE doesn't handle XML with its default DOM
    if (window.ActiveXObject) {

        this.xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    }
        // code for Mozilla, etc.
    else if (document.implementation.createDocument) {

        this.xmlDoc = document.implementation.createDocument('', '', null);
    }
    else {
        throw alert('Your browser cannot handle this script');
    }

    this.soapR = this.xmlDoc.createElement("soap:Envelope");
    // Tilføj Soap attributter. MONORAILHACK erstattes i stringify funktionen. Dette gøres, da XML XMLSerilizeren i IE11 laver rod med workspaces.
    this.soapR.setAttribute("MONORAILHACKxsi", "http://www.w3.org/2001/XMLSchema-instance");
    this.soapR.setAttribute("MONORAILHACKxsd", "http://www.w3.org/2001/XMLSchema");
    this.soapR.setAttribute("MONORAILHACKsoap", "http://schemas.xmlsoap.org/soap/envelope/");


    var Rbody = this.xmlDoc.createElement("soap:Body");

    WmethodName = this.xmlDoc.createElement(this.WebMethodName);
    WmethodName.setAttribute("xmlns", "http://MonoRail.carlbro.dk");

    this.docRoot = this.xmlDoc.createElement("xmlDoc");

    this.varTrees = this.xmlDoc.createElement("varTrees");
    this.dTree = this.xmlDoc.createElement("dTree");
    this.varTrees.appendChild(this.dTree);

    this.docRoot.appendChild(this.varTrees);
    WmethodName.appendChild(this.docRoot);
    Rbody.appendChild(WmethodName);
    this.soapR.appendChild(Rbody);

    /** Output method intended to be called by {@link #mrAJAXrequest}
    @private
    @returns A well formed XML SOAP request
    */
    this.stringify = function () {
        var res = "";
        if (this.soapR.xml)
            res = '<?xml version="1.0" encoding="utf-8"?>' + this.soapR.xml;
        else {
            if (XMLSerializer) {
                var Wser = new XMLSerializer();
                res = '<?xml version="1.0" encoding="utf-8"?>' + Wser.serializeToString(this.soapR);
            } else
                alert("Din browsers håndtering af XML er ikke understøttet. Mozilla Firefox anbefales og Internet Explores kan også bruges.");
        }
        res = res.split('MONORAILHACK').join('xmlns:');
        return res;

    }

    /** Adds an argument to the SOAPrequest object
    @param Aname Argument name.
    @param Avalue Argument value.
    @param AargList Optional: The subtree/list to insert the argument into, the default is dTree
    */

    /****m* Request/addArg
    * NAME
    * addArg
    *
    * DESCRIPTION
    * Adds the name,value argument pair to the request object. defaults to insertion into the 'dTree' NameValueCollection'
    * 
    * USAGE
    * requestObject.addArg(string Aname, string Avalue [ , AargList ] );
    *
    * ARGUMENTS
    * * Aname -- Name of the argument to be passed with the request.
    * * Avalue -- Value of the argument to be passed with the request.
    *
    * OPTIONS
    * * AargList -- The NameValueCollection to insert the argument into, defaults to 'dTree'.
    *
    * SEE ALSO
    * MR/getInputValues
    ****/
    this.addArg = function (Aname, Avalue, AargList) {
        if (AargList && AargList.length > 0) {
            if (!this[AargList]) {
                this[AargList] = this.xmlDoc.createElement(AargList);
                this.varTrees.appendChild(this[AargList]);
            }

            this[AargList].appendChild(this.xmlDoc.createElement(Aname));
            this[AargList].lastChild.appendChild(this.xmlDoc.createTextNode(Avalue));

        }
        else {
            this.dTree.appendChild(this.xmlDoc.createElement(Aname));
            this.dTree.lastChild.appendChild(this.xmlDoc.createTextNode(Avalue));
        }
    }

    /****m* Request/getInputValues
    * NAME
    * getInputValues
    *
    * DESCRIPTION
    * Inserts the values of all inputfields of a defined subarea 
    * or an entire page into the XML tree of this request object.
    *
    * USAGE
    * requestObject.getInputValues( [ string AselectfromId ] );
    * 
    * OPTIONS
    * * AselectFromId -- Optional parameter that specifies the element ID of a subsection of the current page to harvest the html input values from, defaults to the body element when not set.
    *
    *****/
    this.getInputValues = function (AselectFromId) {
        ///helper function
        var _inputInsert = function (AinputElement, Acontext) {
            if (AinputElement.type == "text") {
                if (!Acontext.textF) {
                    Acontext.textF = Acontext.xmlDoc.createElement('textFields');
                    Acontext.varTrees.appendChild(Acontext.textF);
                }
                Acontext.textF.appendChild(Acontext.xmlDoc.createElement(AinputElement.id));
                Acontext.textF.lastChild.appendChild(Acontext.xmlDoc.createTextNode(AinputElement.value));
            }
            else if (AinputElement.type == "password") {
                if (!Acontext.passF) {
                    Acontext.passF = Acontext.xmlDoc.createElement('passwords');
                    Acontext.varTrees.appendChild(Acontext.passF);
                }
                Acontext.passF.appendChild(Acontext.xmlDoc.createElement(AinputElement.id));
                Acontext.passF.lastChild.appendChild(Acontext.xmlDoc.createTextNode(AinputElement.value));

            }

            else if (AinputElement.type == "hidden") {
                if (!Acontext.hiddenF) {
                    Acontext.hiddenF = Acontext.xmlDoc.createElement('hiddenFields');
                    Acontext.varTrees.appendChild(Acontext.hiddenF);
                }

                Acontext.hiddenF.appendChild(Acontext.xmlDoc.createElement(AinputElement.id));
                Acontext.hiddenF.lastChild.appendChild(Acontext.xmlDoc.createTextNode(AinputElement.value));
            }

            else if (AinputElement.type == "checkbox") {
                if (!Acontext.checkB) {
                    Acontext.checkB = Acontext.xmlDoc.createElement('checkBoxes');
                    Acontext.varTrees.appendChild(Acontext.checkB);
                }
                Acontext.checkB.appendChild(Acontext.xmlDoc.createElement(AinputElement.id));
                Acontext.checkB.lastChild.appendChild(Acontext.xmlDoc.createTextNode(AinputElement["checked"].toString()));
            }
            else if (AinputElement.type == "radio") {
                if (AinputElement["checked"] == "checked" || AinputElement["checked"] == true) {
                    if (!Acontext.radioB) {
                        Acontext.radioB = Acontext.xmlDoc.createElement('radioButtons');
                        Acontext.varTrees.appendChild(Acontext.radioB);
                    }
                    Acontext.radioB.appendChild(Acontext.xmlDoc.createElement(AinputElement.name));
                    Acontext.radioB.lastChild.appendChild(Acontext.xmlDoc.createTextNode(AinputElement.id));
                }
            }
        }


        if (AselectFromId && AselectFromId.length > 0) {
            var WselectFrom = MR.getId(AselectFromId);
            if (WselectFrom.tagName.toUpperCase() == 'INPUT') {
                _inputInsert(WselectFrom, this);
                return;
            }
        }

        else
            var WselectFrom = document.getElementsByTagName('body')[0];

        var Winputs = WselectFrom.getElementsByTagName("input");

        for (var i = 0; i < Winputs.length; i++) {
            _inputInsert(Winputs[i], this)
        }
        var WtextAreas = Winputs = WselectFrom.getElementsByTagName("textarea");
        if (WtextAreas.length > 0) {
            for (var i = 0; i < WtextAreas.length; i++) {
                this.addArg(WtextAreas[i].id, WtextAreas[i].value, "textAreas");
            }
        }
        if (WselectFrom.tagName.toLowerCase() == "textarea") {
            this.addArg(WselectFrom.id, WselectFrom.value, "textAreas");
        }
    }
    this.insertPageInputs = this.getInputValues;



    /****m* Request/insertContextValues
    * NAME
    * insertContextValues
    *
    * DESCRIPTION
    * Inserts the values of a given context.
    *
    * USAGE
    * requestObject.insertContextValues(string aContextName);
    * 
    * OPTIONS
    * * AselectFromId -- Optional parameter that specifies the element ID of a subsection of the current page to harvest the html input values from, defaults to the body element when not set.
    *
    *****/

    this.insertContextValues = function (aContextName) {
        var wContext = MR.IdValue.getElement(aContextName);
        for (var wName in wContext)
            this.addArg(wName, wContext[wName], 'context');
    }
}

/** reads the GET parts of the page location into an name/value array; 
@returns an array with the name=values pairs from the GET string (the part following the ? in a URL
*/

MR.pageGets = function () {
    var Wtmp = window.location.href.split('?');
    if (Wtmp.length > 1) {
        var Wout = new Array();
        Wtmp = Wtmp[1].split('&');
        for (var i = 0; i < Wtmp.length; i++) {
            Wout[Wtmp[i].split('=')[0]] = Wtmp[i].split('=')[1];
        }
        return Wout;
    }
    else
        return new Array();
}

/* ****************** End onChange system ******************/
function styleReader(obj) {
    if (obj.currentStyle)
        return obj.currentStyle;
    else if (window.getComputedStyle) {
        return window.getComputedStyle(obj, null);
    }
}


function minZindex(obj) {
    var WminZ = 0;
    var Wstyle = styleReader(obj);

    WminZ = Wstyle.zIndex > 0 ? Wstyle.zIndex : 0;
    if (obj.parentNode) {
        while (obj.tagName && obj.tagName.toUpperCase().indexOf('BODY') != 0) {
            Wstyle = styleReader(obj);
            WminZ = Wstyle.zIndex > WminZ ? Wstyle.zIndex : WminZ;
            obj = obj.parentNode;
        }
    }
    return WminZ;
}

function windowXY() {
    Wout = new Array();

    if (self.clientWidth) {
        Wout.Y = self.clientHeight;
        Wout.X = self.clientWidth;
    }
    else if (document.documentElement && document.documentElement.clientHeight) {	// Explorer 6 Strict Mode
        Wout.X = document.documentElement.clientWidth;
        Wout.Y = document.documentElement.clientHeight;
    }
    else if (document.body) // other Explorers
    {
        Wout.X = document.body.clientWidth;
        Wout.Y = document.body.clientHeight;
    }
    return Wout;
}


function windowScroll() {
    var x, y;
    if (self.pageYOffset) // all except Explorer
    {
        x = self.pageXOffset;
        y = self.pageYOffset;
    }
    else if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft))
        // Explorer 6 Strict
    {
        x = document.documentElement.scrollLeft;
        y = document.documentElement.scrollTop;
    }
    else if (document.body) // all other Explorers
    {
        x = document.body.scrollLeft;
        y = document.body.scrollTop;
    }

    var Woutput = new Array();
    Woutput.X = x;
    Woutput.Y = y;
    return Woutput;
}

function getFrame(src) {
    var tmp = src;
    while (tmp.parentNode.nodeName.indexOf('BODY') != 0)
        tmp = tmp.parentNode;
    return tmp;
}


/* ********************* drag system **********************/


function _dragMode(ed) {
    //    selectListBoxOff();

    if (!self.drag.element) {
        return;
    }
    if (!ed.currentTarget)
        var ed = window.event;

    var X = ed.clientX + self.drag.start.X;
    var Y = ed.clientY + self.drag.start.Y;

    _dragTest(self.drag.element, X, Y);


    if (window.event && window.event.cancelBubble == false) {
        window.event.cancelBubble = true;
        window.event.returnValue = false;
    }
}


function _dragTest(Aelement, aX, aY) {
    var frame = Aelement;
    if (!frame)
        return;

    if (!aX || !aY) {
        var Wstyle = styleReader(frame);
        aX = Number(Wstyle.left.split('px')[0]);
        aY = Number(Wstyle.top.split('px')[0]);
    }

    if (aX < 0)
        aX = 0;

    var WwinSize = windowXY();
    var Wscroll = windowScroll();

    if ((Number(aX) + frame.clientWidth + 7) > WwinSize.X + Wscroll.X) {
        aX = Number(WwinSize.X - frame.clientWidth - 7 + Wscroll.X);
    }


    if ((Number(aY) + frame.clientHeight - Wscroll.Y + 8) > WwinSize.Y) {
        aY = Number(WwinSize.Y - frame.clientHeight + Wscroll.Y - 9);
    }
    frame.style.top = aY + 'px';

    if (aY < 0)
        aY = 0;

    frame.style.top = aY + 'px';
    frame.style.left = aX + 'px';

    //shadowtest
    var Wshade = MR.getId(Aelement.id + "-shadow")
    if (Wshade) {
        Wshade.style.left = Number(aX + MR.Constants.shadowLeft) + 'px';
        Wshade.style.top = Number(aY + MR.Constants.shadowTop) + 'px';
    }
}

self.drag = new Object();
self.drag.start = new Object();

/** 
Gets the dhtml.windows in the zStack in line (or at least within the browser frame), called by 
default on "window resize" events.
*/
function herdWindows() {
    if (!self.zStack || self.zStack.length == 0)
        return;

    for (var i = 0; i < self.zStack.length; i++) {
        _dragTest(MR.getId(self.zStack[i]));
    }
}
//apply
window.onresize = herdWindows;

/** Makes the outermost html element that contains "triggerID" moveable on mousedown on the "triggerID" element. The element defaults to parent element just before the body element if AmoveID is not supplied.
@param AtriggerID ID of the element that is to be made moveable
@param AmoveID Optional argument, the ID of the element to be moved (if not supplied it defaults to parent element just before the body element).
 */
function moveable(AtriggerID, AmoveID) {
    var Warg = MR.getId(AtriggerID);
    MR.Events.handler.add(Warg, 'mousedown', MR.DHTMLfx.window.stackTop);

    MR.Events.handler.add(Warg, 'mousedown', function (e) {
        MR.DHTMLfx.selectList.remove();

        var Wtrigger;
        var Wframe;

        if (AmoveID && AmoveID.length)
            Wtrigger = MR.getId(AmoveID);

        else if (!Wtrigger) {
            if (typeof e.currentTarget != "undefined")
                Wtrigger = e.currentTarget;
            else
                Wtrigger = window.event.srcElement;
        }

        Wframe = getFrame(Wtrigger);

        self.drag.start.Y = Wframe.offsetTop - e.clientY;
        self.drag.start.X = Wframe.offsetLeft - e.clientX;
        self.drag.element = Wframe;
        MR.Events.handler.add(document, 'mousemove', _dragMode, true);

        MR.Events.handler.add(document, 'mouseup', function () {
            _removeEventHandler(document, 'mousemove', _dragMode, true);
            self.drag.element = false;
            self.moveTo = false;
        });
    });
}

/* ****************** toolTip section ******************/

/** Helper function for mouseover tooltips
@private
*/
function tooltipMove(e) {
    var Wtp = MR.getId('toolTip');
    if (!Wtp)
        return;

    if ((!e) || (!e.clientX))
        var e = window.event;
    if (!e)
        return;

    Wscroll = windowScroll();
    var WwinSize = windowXY();
    var Wx = e.clientX + Wscroll.X;
    var Wy = e.clientY + Wscroll.Y;

    var WdualOverflow = 0;

    if (Wtp.clientWidth && (Wx + Wtp.clientWidth + 15 + 16 - Wscroll.X) > WwinSize.X) {
        Wtp.style.left = (WwinSize.X - Wtp.clientWidth - 15 + Wscroll.X) + 'px';
        WdualOverflow++;
    }
    else
        Wtp.style.left = Wx + 15 + 'px';

    if (Wtp.clientHeight && (Wy + Wtp.clientHeight + 15 + 16 - Wscroll.Y) > WwinSize.Y) {
        Wtp.style.top = (WwinSize.Y - Wtp.clientHeight - 15 + Wscroll.Y) + 'px';
        WdualOverflow++;
    }
    else
        Wtp.style.top = Wy + 15 + 'px';

    if (WdualOverflow == 2) {
        var Wstyle = styleReader(Wtp);
        Wtp.style.left = (Wx - (Wtp.clientWidth + 15)) + 'px';
    }
    //	Wtp.style.display='block';
}

/** Helper function for mouseover tooltips
@private
*/
function toolTipOn(Aevent, elementID, displayHTML) {
    //IE doesn't handle mouseover that well
    if (MR.getId('toolTip'))
        return;

    var toolTip = document.createElement('div');
    toolTip.appendChild(document.createElement('div'));
    toolTip.childNodes[0].style.width = "60px";

    toolTip.appendChild(document.createElement('div'));
    toolTip.childNodes[1].style.clear = "both";

    toolTip.setAttribute('id', 'toolTip');
    toolTip.innerHTML = displayHTML;

    //Set max width
    /*if (displayHTML.length > 30)
	toolTip.style.width = '120px';
	else
	{*/
    toolTip.style.width = 'auto';
    toolTip.wordWrap = false
    toolTip.whiteSpace = 'nowrap';
    //}

    var Wtrgt = (typeof elementID == "string" ? MR.getId(elementID) : elementID)

    toolTip.style.zIndex = 100000000; //+minZindex(Wtrgt);
    toolTip.style.position = 'absolute';
    //	toolTip.style.display='none';

    document.getElementsByTagName('body')[0].appendChild(toolTip);
    tooltipMove(Aevent);
}

/** 

*/
function toolTipOff() {
    var WremoveTP = MR.getId('toolTip');
    if (WremoveTP)
        WremoveTP.parentNode.removeChild(WremoveTP);
}

function addToolTip(AtargetId, AhtmlText) {
    if (AhtmlText.length > 0) {
        MR.Events.handler.add(AtargetId, "mousemove", tooltipMove);
        MR.Events.handler.add(AtargetId, "mouseout", toolTipOff);

        //MR.Events.handler.add(AtargetId, "mouseover", function(e){toolTipOn(e,AtargetId, AhtmlText)});
        var fstr = "function(e){toolTipOn(null, '" + AtargetId + "', '" + AhtmlText + "')}";
        MR.Events.handler.add(AtargetId, "mouseover", fstr);
    }
}

/* ****************** End toolTip section ***********************/



/* ****************** Begin selectList section ******************/

/* 
Effectuates the users selectlist choices
*/
function _selectDo(Asrc, AtrgtId) {
    var Wtrgt = MR.getId(AtrgtId);
    var WtrgtV = MR.getId(AtrgtId + '-value');

    //  function to be called later, but it must be setup now before the values we are looking at are changed
    var Wfunc;
    if (WtrgtV && Asrc.id !== WtrgtV.value && (Asrc.id != 'closeSelectListOnSelect')) {
        Wfunc = function () {
            //check to see if the hidden field has any (proprietary system) onchange functions attached to it
            MR.Events.checkOnChange(AtrgtId + '-value');
            MR.Events.checkOnChange(AtrgtId);
        }
    }
    else
        Wfunc = function () { };

    //set to blank?
    if (Asrc.id == 'closeSelectListOnSelect') {
        Wtrgt.value = '';
        WtrgtV.value = '';
        MR.Events.checkOnChange(AtrgtId + '-value');
        MR.Events.checkOnChange(AtrgtId);
    }
    else {
        //store the hidden value
        Wtrgt.value = Asrc.firstChild.data;
        if (WtrgtV)
            WtrgtV.value = Asrc.id;
    }

    //remove selectListBox
    MR.DHTMLfx.selectList.remove();
    Wfunc();
    MR.getId(AtrgtId).focus();
}
//this function is called whenever a key is pressed in a field that has this eventhandler... 
function selectList(AidString, Awebmethod, AkeyCode, AdependsOnId, AviewValues, AaddArgs, AoptURI) {
    //check for selectlist dependency
    if (AdependsOnId && AdependsOnId.length > 0) {
        var WdpnOnV = MR.getId(AdependsOnId).value;
        if (WdpnOnV.length == 0) {
            setTimeout(function () { MR.getId(AidString).value = ''; }, 1);
            return;
        }
    }

    var IsKeyPress = 0;
    if (AkeyCode.keyCode) IsKeyPress = 1;


    if (AkeyCode.keyCode != 0) {
        //initiate the selectlistbox
        var Wslb = MR.getId('selectListBox');

        //check that there is a selected item
        if (Wslb && MR.IdValue.getElement("SelectedInSelectlist").element == null) {
            try {
                MR.IdValue.getElement("SelectedInSelectlist").element = (
                    Wslb.firstChild.firstChild.nodeValue == "-" ?
                    Wslb.firstChild :
                    Wslb.firstChild.nextSibling);
            }
            catch (e) {
                return;
            }
        }

        switch (AkeyCode.keyCode) {
            case 17:	//ctrl
            case 18:	//leftalt
            case 32:	//space
            case 37:	//arrowLeft
            case 39:	//arrowRight
                if (Wslb)
                    return;
                break;

            case 16:	//shift
                //case 9:     //tab 
                return;
                break;

            case 38: //arrowUp
                IsKeyPress = 0
                if (!Wslb || MR.getId('unselectableListText'))
                    break;
                MR.IdValue.getElement("SelectedInSelectlist").element.className = '';


                if (MR.IdValue.getElement("SelectedInSelectlist").element.previousSibling) {
                    MR.IdValue.getElement("SelectedInSelectlist").element = MR.IdValue.getElement("SelectedInSelectlist").element.previousSibling;
                    var Wover = MR.Styles.findPos(MR.IdValue.getElement("SelectedInSelectlist").element).Y -
                                MR.Styles.findPos(Wslb).Y -
                                Wslb.scrollTop;
                    if (Wslb.scrollTop > 0 && Wover < 0)
                        Wslb.scrollTop += Wover;
                }
                else {
                    MR.IdValue.getElement("SelectedInSelectlist").element = Wslb.lastChild;

                    Wslb.scrollTop = MR.Styles.findPos(MR.IdValue.getElement("SelectedInSelectlist").element).Y -
                                MR.Styles.findPos(Wslb).Y -
                                Number(MR.Styles.reader(Wslb).height.split('px')[0]) + 10;
                }

                MR.IdValue.getElement("SelectedInSelectlist").element.className = 'selected';
                return;
                break;

            case 40: //arrowDown
                IsKeyPress = 0
                if (!Wslb || MR.getId('unselectableListText'))
                    break;
                MR.IdValue.getElement("SelectedInSelectlist").element.className = '';

                if (MR.IdValue.getElement("SelectedInSelectlist").element.nextSibling) {
                    MR.IdValue.getElement("SelectedInSelectlist").element = MR.IdValue.getElement("SelectedInSelectlist").element.nextSibling;

                    var Wunder = MR.Styles.findPos(MR.IdValue.getElement("SelectedInSelectlist").element).Y -
                                MR.Styles.findPos(Wslb).Y -
                                Number(MR.Styles.reader(Wslb).height.split('px')[0]) -
                                Wslb.scrollTop + 10;

                    if (Wunder > 0)
                        Wslb.scrollTop += Wunder;
                }
                else {
                    MR.IdValue.getElement("SelectedInSelectlist").element = Wslb.firstChild;
                    Wslb.scrollTop = 0;
                }

                MR.IdValue.getElement("SelectedInSelectlist").element.className = 'selected';
                return;
                break;

            case 13: //enter
            case 9:     //tab
                if (Wslb && MR.IdValue.getElement("SelectedInSelectlist").element && MR.IdValue.getElement("SelectedInSelectlist").element.id !== 'unselectableListText')
                    _selectDo(MR.IdValue.getElement("SelectedInSelectlist").element, AidString);
                return;
                break;

            default:
                MR.getId(AidString + '-value').value = '';
        }
    }


    var Wp2 = function () { selectList_part2(AidString, Awebmethod, AkeyCode, AdependsOnId, AviewValues, AaddArgs, AoptURI, IsKeyPress) };
    if (SelectListTimer != null)
        clearTimeout(SelectListTimer);
    SelectListTimer = setTimeout(Wp2, 300);
}

function selectList_part2(AidString, Awebmethod, AkeyCode, AdependsOnId, AviewValues, AaddArgs, AoptURI, IsKeyPress) {
    var WsoapR = new MR.Request(Awebmethod, Awebmethod, "Services.asmx");

    var Wsrc = MR.getId(AidString);
    WsoapR.addArg("srchStr", Wsrc.value);

    var WdpnOnV = "";
    if (AdependsOnId && AdependsOnId.length > 0)
        var WdpnOnV = MR.getId(AdependsOnId).value;

    var Winsertion = (MR.getId('selectListBox') ? "replace::MR.getId('selectListBox');" : '');

    MR.directCall(Awebmethod, AviewValues,
	    "srchStr:" + Wsrc.value +
	    ';eventSrc:' + AidString +
	    ';insertion:' + Winsertion +
	    (WdpnOnV.length > 0 ? ';dependsOn:' + WdpnOnV : '') + ";" +
        AaddArgs +
        ';isKeyPress:' + IsKeyPress +
        AoptURI);
}


function selectListInsert(AeventSrcId, AthisIsNotAList) {
    var WeventSrc = MR.getId(AeventSrcId);
    var Wtrgt = MR.getId('selectListBox');

    //position the selectListBox	
    Wtrgt.style.display = "none";//this element interferes with "findPos"
    var WsrcPos = MR.Styles.findPos(WeventSrc);
    Wtrgt.style.display = "block";
    Wtrgt.style.zIndex = minZindex(WeventSrc) + 10;

    if (Wtrgt.childNodes.length < 10)
        Wtrgt.style.height = 'auto';

    //set eventhandlers on childnodes (ie the entries)	
    if (!AthisIsNotAList) {
        for (var i = 0; i < Wtrgt.childNodes.length; i++) {
            if (document.addEventListener) {
                Wtrgt.childNodes[i].addEventListener('mousemove', function () {
                    if (this.id == "unselectableListText")
                        return;
                    MR.IdValue.getElement("SelectedInSelectlist").element.className = '';
                    MR.IdValue.getElement("SelectedInSelectlist").element = this;
                    this.className = 'selected';
                }, false);
                Wtrgt.childNodes[i].addEventListener('click', function () {
                    _selectDo(this, AeventSrcId);
                }, false);
            }
            else if (document.attachEvent) {
                Wtrgt.childNodes[i].attachEvent('onmousemove', function () {
                    var Wsrc = window.event.srcElement;
                    if (Wsrc.id == "unselectableListText")
                        return;
                    MR.IdValue.getElement("SelectedInSelectlist").element.className = '';
                    MR.IdValue.getElement("SelectedInSelectlist").element = Wsrc;
                    Wsrc.className = 'selected';
                });
                Wtrgt.childNodes[i].attachEvent('onclick', function () {
                    _selectDo(window.event.srcElement, AeventSrcId);
                });
            }
        }
    }
    //position relative to the correct inputField
    Wtrgt.style.left = (window.event === null ? -1 : 0) + WsrcPos.X + 'px';
    Wtrgt.style.top = WsrcPos.Y + 19 + 'px';
    Wtrgt.style.width = WeventSrc.clientWidth - 6 + 'px';
    if (!AthisIsNotAList) {
        if (Wtrgt.childNodes.length > 0) {
            //select the topmost element    
            MR.IdValue.getElement("SelectedInSelectlist").element = Wtrgt.firstChild;
            if (MR.IdValue.getElement("SelectedInSelectlist").element.id == 'closeSelectListOnSelect' &&
                MR.IdValue.getElement("SelectedInSelectlist").element.nextSibling)
                MR.IdValue.getElement("SelectedInSelectlist").element = MR.IdValue.getElement("SelectedInSelectlist").element.nextSibling;
            MR.IdValue.getElement("SelectedInSelectlist").element.className = 'selected';
        }
    }
}
/* ****************** End selectList section ******************/

/* ****************** Calendar system **********************/

function getPickDate(AeventSrcID, Ayear, Amonth, aServiceUrl) {
    var WsoapE = new MR.Request("datePicker", "datePicker", aServiceUrl || "Services.asmx");
    WsoapE.addArg('year', Ayear);
    WsoapE.addArg('month', Amonth);
    WsoapE.addArg('eventSrcID', AeventSrcID);

    //start from currently selected date
    WsoapE.addArg("currSelectedDate", MR.getId(AeventSrcID).value);

    if (MR.getId('selectListBox')) {
        WsoapE.addArg("insertion", "replace:MR.getId('selectListBox')");
    }
    else
        WsoapE.addArg("insertion", "append:document.getElementsByTagName('body')[0]");
    WsoapE.submit();
}

function calendarInsert(AeventSrcId) {
    var WeventSrc = MR.getId(AeventSrcId);
    var Wcal = MR.getId('selectListBox');

    //we need both of these to proceed
    if (!WeventSrc || !Wcal)
        return;

    //position the selectListBox correct inputField
    Wcal.style.display = "none";//this element interferes with "findPos"
    var WsrcPos = MR.Styles.findPos(WeventSrc);
    Wcal.style.display = "block";
    Wcal.style.zIndex = minZindex(WeventSrc) + 10;

    Wcal.style.left = (window.event === null ? -1 : 0) + WsrcPos.X + 'px';
    Wcal.style.top = WsrcPos.Y + 19 + 'px';
    Wcal.style.width = WeventSrc.clientWidth - 6 + 'px';

    //add a little style
    Wcal.style.height = 'auto';
    Wcal.firstChild.style.height = 'auto';
    Wcal.style.padding = '0px';
    Wcal.style.width = Number(styleReader(Wcal).width.split('px')[0]) + Number(6) + 'px';

    var Wrows = Wcal.getElementsByTagName('tr');
    Wrows[0].style.textAlign = 'center';

    var Fstyler = function (Aele) {
        Aele.style.cursor = 'pointer';
        MR.Events.handler.add(Aele, 'mouseover', function () {
            if (window.event && window.event.srcElement)
                window.event.srcElement.style.backgroundColor = MR.Constants.CalOnMouseColor1;
            else
                this.style.backgroundColor = MR.Constants.CalOnMouseColor1;;
        });

        MR.Events.handler.add(Aele, 'mouseout', function () {
            if (window.event && window.event.srcElement)
                window.event.srcElement.style.backgroundColor = '';
            else
                this.style.backgroundColor = '';
        });
    }
    Fstyler(Wrows[0].childNodes[0]);
    Fstyler(Wrows[0].childNodes[1]);
    Fstyler(Wrows[0].childNodes[3]);
    Fstyler(Wrows[0].childNodes[4]);

    Fstyler(Wrows[Wrows.length - 1].childNodes[0]);
    Fstyler(Wrows[Wrows.length - 1].childNodes[1]);

    for (var i = 1; i < Wrows[1].childNodes.length; i++) {
        Wrows[1].childNodes[i].className = 'CalDayRow';
    }

    Wrows[1].childNodes[0].className = 'CalWeekID';
    for (var i = 2; (i + 1) < Wrows.length; i++) {
        Wrows[i].childNodes[0].className = 'CalWeekNoCol';
        for (var j = 0; j < Wrows[i].childNodes.length; j++) {
            if (Wrows[i].childNodes[j].id) {
                var Wtrgt = Wrows[i].childNodes[j];
                Wtrgt.style.cursor = "pointer";
                if (document.addEventListener) {
                    Wtrgt.addEventListener('mousemove', function () {
                        this.style.backgroundColor = MR.Constants.CalOnMouseColor2;
                    }, false);

                    Wtrgt.addEventListener('mouseout', function () { this.style.backgroundColor = ''; }, false);
                    Wtrgt.addEventListener('click', function () {
                        MR.getId(AeventSrcId).value = _formatMonth(this.id);
                        MR.Events.checkOnChange(AeventSrcId);
                        MR.DHTMLfx.selectList.remove();
                    }, false);
                }
                else if (document.attachEvent) {
                    Wtrgt.attachEvent('onmousemove', function () {
                        window.event.srcElement.style.backgroundColor = MR.Constants.CalOnMouseColor2;
                    });
                    Wtrgt.attachEvent('onmouseout', function () { window.event.srcElement.style.backgroundColor = ''; });
                    Wtrgt.attachEvent('onclick', function () {
                        var Wsrc = window.event.srcElement;
                        MR.getId(AeventSrcId).value = _formatMonth(Wsrc.id);
                        MR.Events.checkOnChange(AeventSrcId);
                        MR.DHTMLfx.selectList.remove();
                    });
                }
            }
        }
    }
}

//used by the calendar dhtml object
function _formatMonth(Anumbers) {
    Anumbers = Anumbers.split('-');
    var Wday = Anumbers[0];
    var Wyear = Anumbers[2];

    var Wmonth;
    switch (Number(Anumbers[1])) {
        case 1: Wmonth = 'Januar';
            break;
        case 2: Wmonth = 'Februar';
            break;
        case 3: Wmonth = 'Marts';
            break;
        case 4: Wmonth = 'April';
            break;
        case 5: Wmonth = 'Maj';
            break;
        case 6: Wmonth = 'Juni';
            break;
        case 7: Wmonth = 'Juli';
            break;
        case 8: Wmonth = 'August';
            break;
        case 9: Wmonth = 'September';
            break;
        case 10: Wmonth = 'Oktober';
            break;
        case 11: Wmonth = 'November';
            break;
        case 12: Wmonth = 'December';
    }
    return Wday + '. ' + Wmonth + ' ' + Wyear;
}
/* ****************** End Calendar system ******************/

/*  waitMessage */

function waitMessage(AtrgtElement, AoptionalMsg) {
    var Wold;
    if (typeof AtrgtElement == "string")
        Wold = MR.getId(AtrgtElement);
    else
        Wold = AtrgtElement;
    var Wreplacement = Wold.cloneNode(false);
    var defMsg = "Henter data, vent venligst";
    Wreplacement.appendChild(document.createElement("h4"));
    Wreplacement.lastChild.setAttribute("class", "waitMessage");
    Wreplacement.lastChild.appendChild(document.createTextNode(((AoptionalMsg && AoptionalMsg.length) ? AoptionalMsg : defMsg)));
    Wold.parentNode.replaceChild(Wreplacement, Wold);
}

function selectListBoxOff() {
    var WselBox = MR.getId('selectListBox');
    if (WselBox) {
        WselBox.parentNode.removeChild(WselBox);
    }
    MR.IdValue.getElement("SelectedInSelectlist").element = false;
}


MR.Text =
{
    setSelection: function (n, start, length) {
        if (n.setSelectionRange)
            n.setSelectionRange(start, (start + length));
        else {
            var tr = n.createTextRange();
            tr.moveStart("character", start);
            tr.moveEnd("character", (-n.value.length + start + length));
            tr.select();
        }
    }
}

/****h* MR/DHTMLfx
* NAME
* DHTMLfx
*
* DESCRIPTION
*  Pseudo namespace for the methods and variables concerning DHTML browser effects.
****/
MR.DHTMLfx =
{

    /****h* DHTMLfx/gridView
	* NAME
	* gridView
	*
	****/
    gridView:
	{
	    /****m* gridView/insertPageSelect
	    * NAME
	    * insertPageSelect
	    *
	    * USAGE
	    * MR.DHTMLfx.gridView.insertPageSelect(bool Adirect, object AcontainingGrid, string AmethodName [,AadditionalVars [,AadditinoalArgs]]);
	    *
	    ****/
	    insertPageSelect: function (Adirect, AcontainingGrid, AmethodName, AadditionalVars, AadditinoalArgs) {
	        var WpageList = AcontainingGrid.getElementsByTagName('tfoot')[0].getElementsByTagName('a');
	        var WmethCallPart1;
	        var WmethCallPart2;
	        var WmaxPage = WpageList[Number(WpageList.length - 1)].firstChild.nodeValue;
	        var WtoPage;
	        var WcurPage = MR.DHTMLfx.gridView.getCurrPage(AcontainingGrid);

	        if (Adirect) {
	            WmethCallPart1 = "javascript:MR.DHTMLfx.gridView.changePage(";
	            WmethCallPart2 = ",'" + AmethodName + "','" + AadditionalVars + "', '" + AadditinoalArgs + "')";
	        }
	        else {
	            WmethCallPart1 = "javascript:" + AmethodName + "(";
	            WmethCallPart2 = (AadditinoalArgs && AadditinoalArgs.length > 0 ? ',' + AadditinoalArgs : '') + ")"
	        }

	        for (var i = 0; i < WpageList.length; i++) {
	            if (WpageList[i].className != 'activeGridPage') {
	                if (WpageList[i].firstChild.nodeValue == "«") {
	                    WtoPage = (WcurPage - (WpageList.length - 2 - (WpageList[WpageList.length - 2].firstChild.nodeValue == "»" ? 2 : 0)));
	                }

	                else if (WpageList[i].firstChild.nodeValue == "»") {
	                    WtoPage = (WcurPage + (WpageList.length - 2 - (WpageList[1].firstChild.nodeValue == "«" ? 2 : 0)));
	                }
	                else {
	                    WtoPage = WpageList[i].firstChild.nodeValue;
	                }

	                if (Number(WtoPage) < 1)
	                    WtoPage = 1;
	                if (Number(WtoPage) > Number(WmaxPage))
	                    WtoPage = WmaxPage;

	                WpageList[i].setAttribute("href", WmethCallPart1 +
	                WtoPage +
	                WmethCallPart2);

	                MR.DHTMLfx.toolTip.add(WpageList[i],
                        "Gå til side " +
                        WtoPage +
                        " af " + WmaxPage);
	            }
	        }
	    },

	    /****m* gridView/changePage
	    * NAME
	    * changePage
	    *
	    * USAGE
	    * MR.DHTMLfx.gridView.changePage();
	    *
	    *****/
	    changePage: function (ApageNo, Awebmethod, AadditionalVars, AadditinoalArgs) {
	        var WsoapR = new MR.Request(Awebmethod, Awebmethod, "Services.asmx");

	        WsoapR.addArg("pageNo", ApageNo);

	        WsoapR.insertContextValues(Awebmethod);

	        if (AadditionalVars && AadditionalVars.length > 0) {
	            var Wviews = AadditionalVars.split(';')
	            var Welement;
	            for (var i = 0; i < Wviews.length; i++) {
	                WsoapR.getInputValues(Wviews[i]);
	            }
	        }

	        if (AadditinoalArgs && AadditinoalArgs.length > 0) {
	            var WargsList = AadditinoalArgs.split(';');
	            for (var i = 0; i < WargsList.length; i++) {
	                try {
	                    WsoapR.addArg(WargsList[i].split(':')[0], WargsList[i].split(':')[1]);
	                }
	                catch (e)
	                { }
	            }
	        }
	        WsoapR.submit();
	    },

	    /****m* gridView/getCurrPage
	    * NAME
	    * getCurrPage
	    *
	    * USAGE
	    * MR.DHTMLfx.gridView.getCurrPage(string/object AcontainingId);
	    *
	    *****/
	    getCurrPage: function (AcontainingId) {
	        var Wcontainer;
	        if (typeof (AcontainingId) == 'object')
	            Wcontainer = AcontainingId;
	        else if (typeof (AcontainingId) == 'string')
	            Wcontainer = MR.getId(AcontainingId);
	        var WpageRefs = Wcontainer.getElementsByTagName('tfoot')[0].getElementsByTagName('a');
	        for (var i = 0; i < WpageRefs.length; i++) {
	            if (WpageRefs[i].className == 'activeGridPage')
	                return Number(WpageRefs[i].firstChild.nodeValue)
	        }
	    }
	},

    /****m* DHTMLfx/shadeElement
	* NAME
	* shadeElement
	*
	* USAGE
	* MR.DHTMLfx.shadeElement(string/Element AelementId);
	*
	* ARGUMENTS
	* * AwinId -- Id of the elelemt or the element to be shade.
	*
	*****/
    shadeElement: function (AelementId) {
        var WtrgtEle;
        if (typeof (AelementId) == 'object')
            WtrgtEle = AelementId;
        else
            WtrgtEle = MR.getId(AelementId);
        try {
            var Wshade = document.createElement('div');
            Wshade.className = 'shade';

            var Wstyle = MR.Styles.reader(WtrgtEle);
            var WhoriPad = (Wstyle.paddingLeft != 'auto' ? Number(Wstyle.paddingLeft.split('px')[0]) : 0) + (Wstyle.paddingRight != 'auto' ? Number(Wstyle.paddingRight.split('px')[0]) : 0);
            var WvertiPad = (Wstyle.paddingTop != 'auto' ? Number(Wstyle.paddingTop.split('px')[0]) : 0) + (Wstyle.paddingBottom != 'auto' ? Number(Wstyle.paddingBottom.split('px')[0]) : 0);
            Wshade.style.width = (WtrgtEle.offsetWidth - WhoriPad) + 'px';
            Wshade.style.height = WtrgtEle.offsetHeight - WvertiPad + 'px';

            if (WtrgtEle.hasChildNodes()) {
                WtrgtEle.insertBefore(Wshade, WtrgtEle.firstChild);
            }
            else {
                WtrgtEle.appendChild(Wshade);
            }
        }
        catch (e) {
        }
    },

    /****m* DHTMLfx/addShadow
	* NAME
	* addShadow
	*
	* USAGE
	* MR.DHTMLfx.addShadow(string AelementId);
	*
	* ARGUMENTS
	* * AwinId -- Id of the elelemt to add a shodow to.
	*****/
    addShadow: function (AelementId) {
        var Wele = MR.getId(AelementId);
        var Wshadow = document.createElement("div");
        Wshadow.className = "shadow";
        Wshadow.style.height = Wele.offsetHeight + "px";
        Wshadow.style.width = Wele.offsetWidth + "px";
        Wshadow.style.zIndex = MR.Styles.minZindex(Wele) - 2;
        Wshadow.id = AelementId + "-shadow";
        Wshadow.style.top = (Number(MR.Styles.reader(Wele).top.split("px")[0]) + MR.Constants.shadowTop) + "px";
        Wshadow.style.left = (Number(MR.Styles.reader(Wele).left.split("px")[0]) + MR.Constants.shadowLeft) + "px";
        document.getElementsByTagName('body')[0].appendChild(Wshadow);
    },

    /****m* DHTMLfx/highlightWithClass
	* NAME
	* highlightWithClass 
	* USAGE
	*  MR.DHTMLfx.highlightWithClass(Element Aelement, string AcssClass, string AeType);
	*
	* DESCRIPTION
	*  Adds onmouse highlightning to the Aelement by switching the elements class.
	*  The optional "AeType" is to help the poor IE eventsource detection.
    *  (ie. the event will trigger on the "td" when you want to highlight its parent "tr").
	*****/
    highlightWithClass: function highlightWithClass(Aelement, AcssClass, AeType) {
        //	    var Wclass = Aelement.className;

        if (Aelement.addEventListener) {
            /*            MR.Controls.highlights[Wstore] = 
                        {
                            On : function(){this.className=AcssClass;}, 
                            Off : function(){this.className = Wclass;} 
                        }
            */
            Aelement.addEventListener('mouseover', function () { MR.Controls.storedHighlightStyle = this.className; this.className = AcssClass; }, false);
            Aelement.addEventListener('mouseout', function () { this.className = (this.className != AcssClass ? this.className : MR.Controls.storedHighlightStyle); }, false);
        }
        else if (Aelement.attachEvent) {
            if (!AeType) {
                /*	            MR.Controls.higlights[Wstore] = 
                                {
                                    On : function(){window.event.srcElement.className=AcssClass;}, 
                                    Off : function(){window.event.srcElement.className=Wclass;}
                                }
                                */
                Aelement.attachEvent('onmouseover', function () {
                    MR.Controls.storedHighlightStyle = window.event.srcElement.className
                    window.event.srcElement.className = AcssClass;
                });
                Aelement.attachEvent('onmouseout', function () {
                    var Wsrc = window.event.srcElement;
                    Wsrc.className = (Wsrc.className != AcssClass ? Wsrc.className : MR.Controls.storedHighlightStyle);
                });
            }
            else if (AeType) {
                /*MR.Controls.higlights[Wstore] = 
                {
                    On : function()
			        {
				        var We = window.event.srcElement;
				        while (We.parentNode && We.tagName.toUpperCase() != AeType.toUpperCase())
					        We = We.parentNode;
				        We.className=AcssClass;
			        }, 
                    Off : function()
			        {
				        var We = window.event.srcElement;
				        while (We.parentNode && We.tagName.toUpperCase() != AeType.toUpperCase())
					        We = We.parentNode;
				        We.className = (We.className== AcssClass? Wclass: We.className);
			        }
                }*/
                Aelement.attachEvent('onmouseover', function () {
                    var We = window.event.srcElement;
                    while (We.parentNode && We.tagName.toUpperCase() != AeType.toUpperCase())
                        We = We.parentNode;
                    MR.Controls.storedHighlightStyle = We.className;
                    We.className = AcssClass;
                });
                Aelement.attachEvent('onmouseout', function () {
                    var We = window.event.srcElement;
                    while (We.parentNode && We.tagName.toUpperCase() != AeType.toUpperCase())
                        We = We.parentNode;
                    We.className = (We.className != AcssClass ? We.className : MR.Controls.storedHighlightStyle);
                });
            }
        }
    },

    /****m* DHTMLfx/highlightWithStyle
	* NAME
	* highlightWithStyle 
	* USAGE
	*  MR.DHTMLfx.highlightWithStyle(Element Aelement, string AcssClass, string AeType);
	*
	* DESCRIPTION
	*  Adds onmouse highlightning to the Aelement by setting the bgcolor.
	*  The optional "AeType" is to help the poor IE eventsource detection.
    *  (ie. the event will trigger on the "td" when you want to highlight its parent "tr").
	*****/
    highlightWithStyle: function (Aelement, AbgColor, AeType) {
        var WbgC = styleReader(Aelement).backgroundColor;
        if (Aelement.addEventListener) {
            Aelement.addEventListener('mouseover', function () { this.style.backgroundColor = AbgColor;; }, false);
            Aelement.addEventListener('mouseout', function () { this.style.backgroundColor = WbgC; }, false);
        }

        else if (Aelement.attachEvent) {
            if (!AeType) {
                Aelement.attachEvent('onmouseover', function () { window.event.srcElement.style.backgroundColor = AbgColor;; });
                Aelement.attachEvent('onmouseout', function () { window.event.srcElement.style.backgroundColor = WbgC; });
            }
            else if (AeType) {
                Aelement.attachEvent('onmouseover', function () {
                    var We = window.event.srcElement;
                    while (We.parentNode && We.tagName.toUpperCase() != AeType.toUpperCase())
                        We = We.parentNode;
                    We.style.backgroundColor = AbgColor;
                });
                Aelement.attachEvent('onmouseout', function () {
                    var We = window.event.srcElement;
                    while (We.parentNode && We.tagName.toUpperCase() != AeType.toUpperCase())
                        We = We.parentNode;
                    We.style.backgroundColor = WbgC;
                });
            }
        }
    },

    /****m* DHTMLfx/insertWaitMsg
	* NAME
	* insertWaitMsg 
	*
	*****/
    insertWaitMsg: function (AtrgtElement, AoptionalMsg) { waitMessage(AtrgtElement, AoptionalMsg); },

    /****h* DHTMLfx/calendar
	* NAME
	* calendar 
	*
	*****/
    calendar:
	{
	    /****m* calendar/insert
		* NAME
		* insert 
		*
		****/
	    insert: calendarInsert,

	    /****m* calendar/format
		* NAME
		* format 
		*
		****/
	    format: function (Anumbers) { _formatMonth(Anumbers); },

	    /****m* calendar/request
		* NAME
		* request 
		*
		****/
	    request: function (AeventSrcID, Ayear, Amonth, AhenvSourceId) {
	        getPickDate(AeventSrcID, Ayear, Amonth, AhenvSourceId);
	    },

	    clientside:
		{
		    parse: function (dstring, elementid) {
		        try {
		            if (dstring && String.length > 0) {
		                var conf = MR.IdValue.getElement(MR.IdValue.get(elementid, "configGroup"));
		                var year = dstring.split(' ')[2];
		                var month = dstring.split(' ')[1];
		                var DOM = dstring.split('.')[0];

		                for (var i = 0; i < conf.monthNames.length; i++) {
		                    if (conf.monthNames[i].toLowerCase() == month.toLowerCase()) {
		                        month = i;
		                        break;
		                    }
		                }
		                if (typeof (month) == 'string') {
		                    var tb = MR.DHTMLfx.calendar.clientside;
		                    return tb.parse(DOM + ". " + tb.monthMatch(month, conf.monthNames, 0, true)[0] + " " + year, elementid);
		                }
		                return new Date(year, month, DOM);
		            }
		            else
		                return new Date();
		        }
		        catch (e) {
		            return new Date();
		        }
		    },

		    monthMatch: function (mstring, months, curchar, bestmatch) {
		        if (mstring.length == curchar)
		            return months;
		        var subset = new Array();
		        for (var i = 0; i < months.length; i++)
		            if (months[i].toLowerCase().charCodeAt(curchar) == mstring.toLowerCase().charCodeAt(curchar))
		                subset.push(months[i]);

		        if (subset.length == 1)
		            return subset;

		        if (bestmatch && subset.length == 0 && months.length > 0)
		            return new Array(months[0]);

		        var nmatch = MR.DHTMLfx.calendar.clientside.monthMatch(mstring, subset, curchar + 1, bestmatch);
		        switch (nmatch.length) {
		            case 0:
		                if (bestmatch)
		                    return subset;
		                return nmatch;
		                break;
		            case 1:
		                return nmatch;
		                break;
		            default:
		                if (bestmatch)
		                    return new Array(nmatch[0]);
		                else return nmatch;
		                break;
		        }
		    },

		    format: function (dobj, elementid) {
		        var conf = MR.IdValue.getElement(MR.IdValue.get(elementid, "configGroup"));
		        var str = (dobj.getDate() + ". ");
		        str += conf.monthNames[dobj.getMonth()] + " ";
		        str += dobj.getFullYear();
		        return str;
		    },

		    keypress: function (e, eId) {
		        var n = MR.getId(eId);
		        var kc = e.which || e.keyCode;
		        //test if the pressed key is within range
		        if (!(kc > 64 && kc < 91) && !(kc > 47 && kc < 58) && !(kc > 95 && kc < 106))
		            return false;

		        // handle numerical keys
		        if ((kc > 95) && (kc < 106))
		            kc = kc - 48

		        var tb = MR.DHTMLfx.calendar.clientside;
		        if (!n.value || n.value.length == 0)
		            n.value = tb.format(new Date(), eId);

		        var state = MR.IdValue.getElement(eId)

		        switch (state.selected) {
		            case 0:
		                if (kc > 47 && kc < 58) {
		                    MR.IdValue.set(eId, 'altered', true);
		                    if (state.offset == 1) {
		                        var d = tb.parse(
		                            n.value.split('.')[0] +
		                            String.fromCharCode(kc)
		                            + ". " + n.value.split(' ')[1] +
		                            ' ' + n.value.split(' ')[2], eId);
		                        n.value = tb.format(d, eId);
		                        state.offset = 0;
		                        state.selected = 1;
		                    }
		                    else {
		                        n.value = String.fromCharCode(kc) + ". " + n.value.split(' ')[1] + ' ' + n.value.split(' ')[2];
		                        if (parseInt(String.fromCharCode(kc)) > 3) {
		                            state.selected = 1
		                            state.offset = 0;
		                        }
		                        else {
		                            state.offset = 1;
		                        }
		                    }
		                }
		                break;
		            case 1:
		                var conf = MR.IdValue.getElement(state.configGroup);
		                if (kc > 64 && kc < 91) {
		                    MR.IdValue.set(eId, 'altered', true);
		                    var mtext;
		                    mtext = n.value.split(' ')[1];
		                    if (!state.offset) {
		                        state.offset = 0;
		                        mtext = '';
		                    }
		                    mtext += String.fromCharCode(kc);

		                    var m = tb.monthMatch(
                                mtext,
                                conf.monthNames,
                                0, false);
		                    if (m.length == 0)
		                        return;
		                    if (m.length == 1) {
		                        n.value = n.value.split(' ')[0] + ' '
                                + m[0].toLowerCase() + ' ' +
                                n.value.split(' ')[2];
		                        state.offset = 0;
		                        state.selected = 2;
		                    }
		                    else {
		                        n.value = n.value.split(' ')[0] + ' '
                                + mtext.toLowerCase() + ' ' +
                                n.value.split(' ')[2];
		                        state.offset++;
		                    }
		                }
		                break;
		            case 2:
		                //		                if (kc == 8)
		                //		                {
		                //		                    var mtext = n.value.split(' ')[2];
		                //		                    if (mtext.length > 0)
		                //		                    {
		                //		                        mtext = mtext.substring(0, mtext.lengt -1);
		                //		                        MR.IdValue.set(eId, 'altered', true);
		                //		                    }
		                //		                    n.value = n.value.split(' ')[0]+" "+n.value.split(' ')[1]+' '+mtext;
		                //		                    
		                //		                }   
		                //		                else 
		                if (kc > 47 && kc < 58) {
		                    MR.IdValue.set(eId, 'altered', true);
		                    var mtext = n.value.split(' ')[2];
		                    if (!state.offset)
		                        state.offset = 0;
		                    if (state.offset == 0)
		                        mtext = '';

		                    n.value = n.value.split(' ')[0] + " " + n.value.split(' ')[1] + ' ' + mtext + String.fromCharCode(kc);
		                    if (state.offset == 3) {
		                        n.value = tb.format(tb.parse(n.value, eId), eId);
		                        state.offset = 0;
		                        state.selected = 0;
		                        MR.Events.checkOnChange(eId);
		                    }
		                    else
		                        state.offset++;
		                }
		                break;
		        }
		        return false;
		    }
		},

	    keydown: function (e, eId) {
	        var tb = MR.DHTMLfx.calendar.clientside;
	        var writeToField = false;

	        var selected = MR.IdValue.get(eId, 'selected');
	        if (!selected && selected !== 0) {
	            selected = 0;
	            MR.IdValue.set(eId, 'selected', selected);
	        }

	        //TODO suppress onchange
	        //		    MR.IdValue.set(eId, 'onchange',MR.Controls.onChange[eId]);
	        //		    MR.Controls.onChange[eId] = undefined;

	        MR.DHTMLfx.selectList.remove();
	        var n = MR.getId(eId);
	        var d = tb.parse(n.value, eId);

	        switch (e.keyCode) {
	            case 13: //retur
	                n.blur();
	            case 9: //tab
	                n.value = tb.format(tb.parse(n.value, eId), eId);
	                if (MR.IdValue.get(eId, 'altered')) {
	                    MR.Events.checkOnChange(eId);
	                    MR.IdValue.set(eId, 'altered', false);
	                }
	                break;
	            case 27: //esc
	                if (n.value.length > 0)
	                    MR.IdValue.set(eId, 'altered', true);
	                n.value = '';
	                MR.IdValue.set(eId, 'offset', undefined);
	                if (MR.IdValue.get(eId, 'altered')) {
	                    MR.Events.checkOnChange(eId);
	                    MR.IdValue.set(eId, 'altered', false);
	                }
	                break;
	            case 190: //punktum
	            case 32: //space
	            case 39: //pil højre
	                selected = (selected + 1) % 3;
	                writeToField = true;
	                MR.IdValue.set(eId, 'selected', selected);
	                MR.IdValue.set(eId, 'offset', undefined);
	                break;
	            case 37: //pil venstre
	                selected = (selected - 1) % 3;
	                if (selected < 0)
	                    selected = 2;
	                writeToField = true;
	                MR.IdValue.set(eId, 'selected', selected);
	                MR.IdValue.set(eId, 'offset', undefined);
	                break;
	            case 40: //pil ned
	                switch (selected) {
	                    case 0:
	                        d.setDate(d.getDate() - 1);
	                        break;
	                    case 1:
	                        d.setMonth(d.getMonth() - 1);
	                        break;
	                    case 2:
	                        d.setYear(d.getFullYear() - 1);
	                        break;
	                }
	                MR.IdValue.set(eId, 'altered', true);
	                writeToField = true;
	                MR.IdValue.set(eId, 'offset', undefined);
	                break;
	            case 38: //pil op
	                switch (selected) {
	                    case 0:
	                        d.setDate(d.getDate() + 1);
	                        break;
	                    case 1:
	                        d.setMonth(d.getMonth() + 1);
	                        break;
	                    case 2:
	                        d.setYear(d.getFullYear() + 1);
	                        break;
	                }
	                MR.IdValue.set(eId, 'altered', true);
	                writeToField = true;
	                MR.IdValue.set(eId, 'offset', undefined);
	                break;
	            default:
	                writeToField = tb.keypress(e, eId);
	                break;
	        }

	        if (writeToField == 1)
	            n.value = tb.format(d, eId);

	        //e.preventDefault();
	        // Forhindre piltasterne i at blive sendt til bruwservinduer
	        if ((window.event) && ((e.keyCode == 40) || (e.keyCode == 38) || (e.keyCode == 37) || (e.keyCode == 39)))
	            event.returnValue = false;
	    },
	    keyup: function (e, eId) {
	        var n = MR.getId(eId);
	        var s = MR.IdValue.get(eId, 'selected');
	        if (n.value.length)
	            switch (s) {
	                case 0:
	                    MR.Text.setSelection(n, 0, n.value.indexOf('.'));
	                    break;
	                case 1:
	                    MR.Text.setSelection(n, n.value.indexOf('.') + 2, n.value.split(' ')[1].length);
	                    break;
	                case 2:
	                    var le = n.value.split(' ')[2].length;
	                    MR.Text.setSelection(n, n.value.length - le, le);
	                    break;
	            }
	    }
	},

    /****m* DHTMLfx/selectList
	* NAME
	* selectList 
	*
	*****/
    selectList:
	{
	    /****m* selectList/insert
		* NAME
		* insert 
		*
		****/
	    insert: selectListInsert,

	    /****m* selectList/request
		* NAME
		* request 
		*
		****/
	    request: selectList,

	    /****mi selectList/request_part2
		* NAME
		* request_part2 
		*
		****/
	    request_part2: selectList_part2,

	    /****m* selectList/remove
		* NAME
		* remove 
		*
		****/
	    remove: selectListBoxOff,

	    /****m* selectList/setFieldValues
		* NAME
		* setFieldValues 
		*
		****/
	    setFieldValues: _selectDo
	},


    /****h* DHTMLfx/toolTip
	* NAME
	* toolTip 
	*
	****/
    toolTip:
	{
	    /****m* toolTip/show 
		* NAME
		* show 
		*
		****/
	    show: toolTipOn,

	    /****m* toolTip/hide 
		* NAME
		* hide 
		*
		****/
	    hide: toolTipOff,

	    /****m* toolTip/add 
		* NAME
		* add 
		*
		****/
	    add: addToolTip,

	    /****m* toolTip/move 
		* NAME
		* move 
		*
		****/
	    move: tooltipMove
	},

    /****h* DHTMLfx/window
	* NAME
	* window
	*
	* DESCRIPTION
	*  Pseudo namespace for the methods concerning dhtml windows.
	*
	****/
    window:
	{
	    /****m* window/setTitle
		* NAME
		* setTitle
		*
		* DESCRIPTION
		* Sets the title of the window
		*
		* USAGE
		* MR.DHTMLfx.window.close(string AwindowFrameId, string Atitle);
		*
		****/
	    setTitle: function (AwindowFrameId, Atitle) {
	        try {
	            MR.getId(AwindowFrameId + '-HB').getElementsByTagName('div')[0].firstChild.nodeValue = Atitle;
	        }
	        //silent catch
	        catch (e)
	        { }
	    },

	    /****m* window/realign
		* NAME
		* realign
		*
		* DESCRIPTION
		* Realigns the width of the handlebar element and (if set) the size of the shadow element.
		*
		* USAGE
		* MR.DHTMLfx.window.realign(string AwindowFrameId);
		*
		****/
	    realign: function (AwindowFrameId) {
	        /*Handlebar width */
	        var WchildW = MR.getId(AwindowFrameId + '-CF').offsetWidth;
	        if (WchildW > 0) {
	            var Wwframe = MR.getId(AwindowFrameId);
	            Wwframe.style.width = WchildW + 'px';

	            //the width of the internal div in the handlebar is decreased to make room for the 2 buttons
	            Wwframe.getElementsByTagName('div')[0].style.width = (WchildW) + 'px';
	        }

	        /* Shadow size */
	        //test for shadow
	        var Wshadow = MR.getId(AwindowFrameId + "-shadow");
	        if (Wshadow) {
	            Wshadow.parentNode.removeChild(Wshadow);
	            MR.DHTMLfx.addShadow(AwindowFrameId);
	        }
	    },

	    /****m* window/close
		* NAME
		* close
		*
		* DESCRIPTION
		* closes the window specified by the ID
		*
		* USAGE
		* MR.DHTMLfx.window.close(string AwindowFrameId);
		*
		* ARGUMENTS
		* * AwindowFrameId -- ID of the frame of the window that this function should close (ie remove)
        * * AoncloseCode  -- Optional code to be called immediately before the window is removed
		* EXAMPLE
		*.
		*  MR.DHTMLfx.window.close('idOfWindowToBeClosed' [,AoncloseCode]);
		*
		* SEE ALSO
		* window.close
		****/
	    close: function (AwindowFrameId, AoncloseCode) {
	        var WcloseMe = MR.getId(AwindowFrameId);
	        if (!WcloseMe)
	            return
	        if (AoncloseCode)
	            eval(AoncloseCode);

	        WcloseMe.parentNode.removeChild(WcloseMe);
	        //    MR.DHTMLfx.selectList.remove();
	        MR.DHTMLfx.toolTip.hide();

	        //test for shadow
	        var Wshadow = MR.getId(AwindowFrameId + "-shadow");
	        if (Wshadow)
	            Wshadow.parentNode.removeChild(Wshadow);
	    },

	    /****m* window/remove
		* NAME
		* remove
		*
		* DESCRIPTION
		* Alias for window.close
		*
		* SEE ALSO
		* window.close
		****/
	    remove: this.close,

	    /****m* window/stackTop 
		* NAME
		* stackTop 
		*
		****/
	    stackTop: function (e) {
	        if (!self.zStack)
	            self.zStack = new Array();

	        if (typeof (e) == 'string')
	            var id = e;
	        else {
	            if (e.currentTarget)
	                var id = getFrame(e.currentTarget).id;
	            else
	                var id = getFrame(window.event.srcElement).id;
	        }
	        var i = 0;
	        //find current position
	        while (self.zStack[i]) {
	            if (self.zStack[i].indexOf(id) == 0 && id.indexOf(self.zStack[i]) == 0) {
	                self.zStack.splice(i, 1);
	                break;
	            }
	            else
	                i++;
	        }
	        self.zStack.unshift(id);
	        i = 0;
	        while (self.zStack[i]) {
	            WtmpZ = MR.getId(self.zStack[i]);
	            if (WtmpZ) {
	                WtmpZ.style.zIndex = (100000 - (5 * i));

	                //test for shadow
	                var Wshadow = MR.getId(self.zStack[i] + "-shadow");
	                if (Wshadow)
	                    Wshadow.style.zIndex = WtmpZ.style.zIndex - 1;
	                i++;
	            }
	            else
	                self.zStack.splice(i, 1);
	        }
	    },
	    /****m* window/fold 
		* NAME
		* fold
		*
		****/
	    fold: function (AwinId) {
	        MR.getId(AwinId + '-CF').style.display = 'none';
	        var WfldBtn = MR.getId(AwinId + '-foldBtn');

	        var WrplcBtn = document.createElement('img');
	        WrplcBtn.src = 'MonoRail/graphics/unfoldWindow.gif';
	        WfldBtn.parentNode.replaceChild(WrplcBtn, WfldBtn);
	        WrplcBtn.id = AwinId + '-foldBtn';
	        MR.DHTMLfx.toolTip.add(WrplcBtn, "Udfold vinduet");
	        MR.DHTMLfx.toolTip.hide();

	        //realign shadow
	        MR.DHTMLfx.window.realign(AwinId);

	        MR.Events.handler.add(WrplcBtn, 'click', function () { MR.DHTMLfx.window.unfold(AwinId) }, true);

	        MR.DHTMLfx.window.herd();
	    },

	    /****m* window/unfold 
		* NAME
		* unfold
		*
		* USAGE
		* MR.DHTMLfx.window.unfold(string AwinId);
		*
		* ARGUMENTS
		* * AwinId -- Id of the window to unfold.
		****/
	    unfold: function (AwinId) {
	        var elm = MR.getId(AwinId + '-CF');
	        if (elm == null) return;
	        elm.style.display = '';
	        var WfldBtn = MR.getId(AwinId + '-foldBtn');
	        var WrplcBtn = document.createElement('img');
	        WrplcBtn.src = 'MonoRail/graphics/foldWindow.gif';
	        WfldBtn.parentNode.replaceChild(WrplcBtn, WfldBtn);
	        WrplcBtn.id = AwinId + '-foldBtn';
	        MR.DHTMLfx.toolTip.add(WrplcBtn, "Fold vinduet");
	        MR.DHTMLfx.toolTip.hide();
	        MR.Events.handler.add(WrplcBtn, 'click', function () { MR.DHTMLfx.window.fold(AwinId) }, true);

	        //realign shadow
	        MR.DHTMLfx.window.realign(AwinId);

	        MR.DHTMLfx.window.herd();
	    },

	    dblclickfolder: function (AwinId) {
	        var WcntFrm = MR.getId(AwinId + '-CF');
	        if (MR.Styles.reader(WcntFrm).display != 'none')
	            MR.DHTMLfx.window.fold(AwinId);
	        else
	            MR.DHTMLfx.window.unfold(AwinId);
	    },

	    /****m* window/herd 
		* NAME
		* herd
		*
		* USAGE
		* MR.DHTMLfx.window.herd();
		*
		* DESCRIPTION
		* Positions all dhtmlWindows inside the current visible window frame.
		****/
	    herd: herdWindows
	},
    /****h* DHTMLfx/tabs
    * NAME
    * tabs 
    *
    ****/
    tabs:
    {
        /****m* tabs/supplyIdsFromBar 
		* NAME
		* supplyIdsFromBar
		*
		* USAGE
		* MR.DHTMLfx.tabs.supplyIdsFromBar(request Arequest, string AbarId);
		****/
        supplyIdsFromBar: function (Arequest, AbarId) {
            var WcurTabs = MR.getId(AbarId).getElementsByTagName('span');
            for (var i = 0; i < WcurTabs.length; i++) {
                Arequest.addArg(WcurTabs[i].id, (WcurTabs[i].innerText ? WcurTabs[i].innerText : WcurTabs[i].textContent), 'tabsList');
            }
        },

        /****m* tabs/selectedTabId 
		* NAME
		* selectedTabId
		*
		* USAGE
		* MR.DHTMLfx.tabs.selectedTabId(string AtabFrameId);
		*
		* RETURN VALUE
		* Element Id of the selected tab.
		****/
        selectedTabId: function (AtabFrameId) {
            var WElement = MR.getId(AtabFrameId);
            if (WElement != null) {
                Wtabs = WElement.getElementsByTagName('span');
                for (var i = 0; i < Wtabs.length; i++) {
                    if (Wtabs[i].className == 'selectedTab' || Wtabs[i].className == 'selTabsHover')
                        return Wtabs[i].id;
                }
            } else return "";
        },

        /****m* tabs/addHighLights 
		* NAME
		* addHighLights
		*
		* USAGE
		* MR.DHTMLfx.tabs.addHighLights(string/objec/object[] AtoBehighlighted);
		*
		* NOTES
		* Notice the polymorphism of the input. 
		*  * A string could either be the id of a single tab or the id of the containing tabs bar.
		*  * An object could either be a single tab or all the tabs in a tabs bar.
		****/
        addHighLights: function (AtabFrameId) {
            var Wtabs;
            switch (typeof (AtabFrameId)) {
                case "string":
                    Wtabs = MR.getId(AtabFrameId).getElementsByTagName('span');
                    break;

                case "object":
                    Wtabs = AtabFrameId;
                    break;
            }
            if (Wtabs.length == 0 || Wtabs.length == undefined) {
                if (typeof (AtabFrameId) == 'object')
                    Wtabs = new Array(Wtabs);
                else
                    Wtabs = new Array(MR.getId(AtabFrameId));

            }
            for (var i = 0; i < Wtabs.length; i++) {
                MR.Events.handler.add(Wtabs[i], 'mouseover',
                function () {
                    var Wsrc = window.event ? window.event.srcElement : this;
                    if (Wsrc.className == 'selectedTab' || Wsrc.className == 'selTabsHover')
                        Wsrc.className = 'selTabsHover';
                    else Wsrc.className = 'tabsBarHover';
                });

                MR.Events.handler.add(Wtabs[i], 'mouseout',
                function () {
                    var Wsrc = window.event ? window.event.srcElement : this;
                    if (Wsrc.className == 'selTabsHover')
                        Wsrc.className = 'selectedTab';
                    else Wsrc.className = '';
                });
            }
        },

        /****m* tabs/changeTo
		* NAME
		* changeTo
		*
		* USAGE
		* MR.DHTMLfx.tabs.changeTo(string AchangeToId [,string AfolloupWebmethod [, string AviewValues [, string AaddArgs]]])
		****/
        changeTo: function (AchangeToId, AfolloupWebmethod, AviewValues, AaddArgs, AserviceURL) {
            var AtabFrameId = MR.getId(AchangeToId).parentNode.parentNode.id;
            var Wtabs = MR.getId(AtabFrameId + "-bar").getElementsByTagName('span');
            for (var i = 0; i < Wtabs.length; i++) {
                //                if (Wtabs[i].className == 'selectedTab' || Wtabs[i].className == 'selTabsHover')
                //                {
                Wtabs[i].className = '';
                //                }

                if (Wtabs[i].id == AchangeToId) {
                    Wtabs[i].className = 'selTabsHover';
                }
            }

            if (AfolloupWebmethod && AfolloupWebmethod.length > 0) {
                AaddArgs =
                    'tabFrameId:' + AtabFrameId +
                    ';changeToId:' + AchangeToId +
                    ';selectedTab:' + AchangeToId + ';' +
                    AaddArgs;
                MR.directCall(AfolloupWebmethod, AviewValues, AaddArgs, AserviceURL);
            }
        },

        /****m* tabs/add 
		* NAME
		* add
		*
		* USAGE
		* MR.DHTMLfx.tabs.add(string AtabFrameId, string AaddId, string AaddLabel, string/function AonClick [, string AfolloupWebmethod [, string AviewValues [, string AaddArgs]]])
		****/
        add: function (AtabFrameId, AaddId, AaddLabel, AonClick, AfolloupWebmethod, AviewValues, AaddArgs) {
            //if this tab already exists
            if (MR.getId(AaddId)) {
                MR.DHTMLfx.tabs.changeTo(AaddId, AfolloupWebmethod, AviewValues, AaddArgs);
                return;
            }
            if (AfolloupWebmethod && AfolloupWebmethod.length > 0) {
                AaddArgs = 'tabFrameId:' + AtabFrameId +
                ';addLabel:' + AaddLabel +
                ';addId:' + AaddId +
                ';selectedTab' + AaddId +
                'onClick' + AonClick + ';' + AaddArgs;

                MR.directCall(AfolloupWebmethod, AviewValues, AaddArgs);
            }
            //construct and append new tab
            var WnewTab = document.createElement('span');
            WnewTab.appendChild(document.createTextNode(AaddLabel));
            WnewTab.setAttribute("id", AaddId);
            MR.Events.handler.add(WnewTab, "click", AonClick);
            MR.getId(AtabFrameId + '-bar').insertBefore(WnewTab,
                MR.getId(AtabFrameId + '-bar').getElementsByTagName('div')[0]);
            setTimeout(function () { MR.DHTMLfx.tabs.addHighLights(MR.getId(AaddId)) }, 100);

            //most people would expect a "changeTo" in the script that inserts the new tab, but its optional.
        },
        /****m* tabs/remove 
		* NAME
		* remove
		*
		* USAGE
		* MR.DHTMLfx.tabs.remove(string AremoveId, string AfocusToId [, string/function AfolloupWebmethod [, string AviewValues [, string AaddArgs]]])
		****/
        remove: function (AremoveId, AfocusToId, AfolloupWebmethod, AviewValues, AaddArgs) {
            var AtabFrameId = MR.getId(AremoveId).parentNode.parentNode.id;
            var Wrequest = new MR.Request(AfolloupWebmethod, AfolloupWebmethod, "Services.asmx");
            Wrequest.addArg('tabFrameId', AtabFrameId);
            Wrequest.addArg('addLabel', AaddLabel);
            Wrequest.addArg('removeId', AremoveId);
            Wrequest.addArg('focusToId', AfocusToId);
            Wrequest.addArg('selectedTab', AfocusToId);

            //add any additional vars
            if (AviewValues && AviewValues.length > 0) {
                var Wviews = AviewValues.split(';')
                var Welement;
                for (var i = 0; i < Wviews.length; i++) {
                    Wrequest.getInputValues(Wviews[i]);
                }
            }
            if (AaddArgs && AaddArgs.length > 0) {
                for (argP in AaddArgs.split(';')) {
                    Wrequest.addArg(argP.split(':')[0], argP.split(':')[1]);
                }
            }
            Wrequest.submit();

            var WrmId = MR.getId(AremoveId);
            WrmId.parentNode.removeChild(WrmId, true);

            MR.DHTMLfx.tabs.changeTo(AfocusToId);
        }
    },
    /****h* DHTMLfx/menu
    * NAME
    * menu 
    *
    ****/
    menu:
    {
        /****h* menu/insert
        * NAME
        * insert 
        *
        ****/
        insert: function () {
            /*			var Wuls = MR.getId('nav').getElementsByTagName('ul');
                        for (var i = 0; i< Wuls.length; i++)
                        {
                            var Wwidth = MR.Styles.reader(Wuls[i]).width;
                            for (var j = 0; j< Wuls[i].childNodes.length; j++)
                            {
                                if (Number(Wwidth.split('em')[0])>0)
                                {
                                    Wuls[i].childNodes[j].style.width = Wwidth;
                                    if (Wuls[i].childNodes[j].firstChild.nodeName.toLowerCase() == "a")
                                    {
                                        Wuls[i].childNodes[j].firstChild.style.paddingRight = Wwidth;
                                    }
                                }
                            }
                            Wuls[i].style.width = '';
                        }*/
            if (window.attachEvent) {
                var sfEls = document.getElementById("navbar").getElementsByTagName("LI");
                for (var i = 0; i < sfEls.length; i++) {
                    MR.Events.handler.add(sfEls[i], 'mouseenter', function () {
                        window.event.srcElement.className += " sfhover";
                    });
                    MR.Events.handler.add(sfEls[i], 'mouseleave', function () {
                        window.event.srcElement.className = window.event.srcElement.className.replace(new RegExp(" sfhover\\b"), "");
                    })
                }
            }
        }
    }
}

/****h* MR/Styles
*NAME
* Styles
*
*DESCRIPTION
* Pseudo Namespace for methods that handle style attributes on elements
*
****/
MR.Styles =
{
    /****m* Styles/reader
	* NAME
	*  reader
	*
	* DESCRIPTION
	*  Returns the computed style object of the element that was given as argument.
	*
	* USAGE
	*  Mr.Styles.reader(element someElement);
	*
	* ARGUMENTS
	*  html element 
	*
	* RETURN VALUE
	*  Computed style object of the element
	*
	* EXAMPLE
	*  //Reading the width attributte of the element with ID =="inputfield1"
	*   var Wwidth = Mr.Styles.reader(MR.getId('inputfield1')).width;
	*
	*****/
    reader: styleReader,

    /****m* Styles/windowXY
	* NAME
	*  windowXY
	*
	* USAGE
	*  Mr.Styles.windowXY();
	*
	* DESCRIPTION
	*  Reads the innerWidth of the browserwindow
	*
	* ARGUMENTS
	*  None
	*
	* RETURN VALUE
	* Returns an object containing the vars X and Y representing the innerWidth of the browserwindow
	*
	* EXAMPLE
	* .
	*    var Wxy = MR.Styles.windowXY();
	*    alert('window height is'+ Wxy.Y+'px and window width is '+Wxy.X+'px.');
	*
	* SEE ALSO
	* Styles/windowScroll
	*****/
    windowXY: windowXY,

    /****m* Styles/windowScroll
	* NAME
	*  windowScroll
	*
	* DESCRIPTION
	*  Reads the scrolling offset of the browserwindow
	*
	* USAGE
	*  Mr.Styles.windowXY();
	*
	* ARGUMENTS
	*  None
	*
	* RETURN VALUE
	* Touple of the form {X : [value] ,Y : [value]}
	*
	* EXAMPLE
	* .
	*    var Wxy = MR.Styles.windowScroll();
	*    alert('browser has scrolled is'+ Wxy.Y+'px downwards and '+Wxy.X+'px to the right.');
	*
	* SEE ALSO
	* Styles/windowXY
	*****/
    windowScroll: windowScroll,

    /****m* Styles/innerScroll
	* NAME
	* innerScroll
	*
	* USAGE
	* MR.Styles.innerScroll(element Aobj)
	*
	* RETURN VALUE
	* Touple of the form {X : [value] ,Y : [value]}
	****/
    innerScroll: function (Aelement) {
        var Wframe = getFrame(Aelement);
        var WscrollX = 0;
        var WscrollY = 0;
        while (Aelement !== Wframe) {
            WscrollY += Aelement.scrollTop;
            WscrollX += Aelement.scrollLeft;
            Aelement = Aelement.parentNode;
        }
        return { X: WscrollX, Y: WscrollY };
    },


    /****m* Styles/minZindex
	* NAME
	* minZindex
	*
	* USAGE
	* MR.Styles.minZindex(element Aobj)
	*
	* RETURN VALUE
	* Calculated zIndex of the element.
	****/
    minZindex: minZindex,

    /****m* Styles/findPos
	* NAME
	* findPos
	*
	* USAGE
	* MR.Styles.findPos(element Aobj[,element ArelativeTo])
	*
    * ARGUMENTS
	* * Aobj -- Object to find position of. 
	* * AeventType -- Optional parent element reference to find the position relative to
	*	
	* RETURN VALUE
	* Touple of the form {X : [value] ,Y : [value]}
	****/
    findPos: function (obj, ArelativeTo) {
        var Wout = new Array();
        Wout.X = 0;
        Wout.Y = 0;

        if (obj.offsetParent) {
            while (1) {
                Wout.X += obj.offsetLeft;//- obj.scrollLeft;
                Wout.Y += obj.offsetTop;//- obj.scrollTop;

                if (obj.currentStyle && obj.currentStyle.borderLeftWidth.indexOf('px') != -1) {
                    Wout.X += Number(obj.currentStyle.borderLeftWidth.split('px')[0]);
                }
                if (obj.parentNode == ArelativeTo || !obj.offsetParent) {
                    break;
                }
                obj = obj.offsetParent;
            }
        }
        else if (obj.x) {
            Wout.X += obj.x - obj.scrollLeft;
            Wout.Y += obj.y - obj.scrollTop;
        }
        return Wout;
    },



    /****m* Styles/minZindex
	* NAME
	* minZindex
	*
	* USAGE
	* MR.Styles.minZindex(element Aobj)
	*
	* RETURN VALUE
	* Calculated zIndex of the element.
	****/
    minZindex: minZindex,


    /****m* Styles/rgb2hex
	* NAME
	* rgb2hex
	*
	* USAGE
	* MR.Styles.rgb2hex(string rgbvalue)
	*
	* RETURN VALUE
	* A string like  'rgb(255,255,255)' converted to '#fffff'
	****/
    rgb2hex: function (rgb) {
        if (rgb != null && rgb.indexOf('rgb') > -1) {
            rgb = rgb.replace('rgb', '').replace('(', '').replace(')', '');
            var c = rgb.split(',');
            rgb = '#';
            for (n in c) {
                c[n] = parseInt(c[n]).toString(16);
                while (c[n].length < 2)
                    c[n] = '0' + c[n];
                rgb += c[n];
            }
        }
        return rgb;
    }
}

/****h* MR/Events
* NAME
* Events
*
* DESCRIPTION
* Pseudo namespace for methods and variables concerning event handling
*
****/

MR.Events =
{
    /****m* Events/addOnChange 
	* NAME
	* addOnChange 
	*
	* USAGE
	* MR.Events.addOnChange(string AelementId, function Achangefunc)
	****/
    addOnChange: function (AelementId, AChangefunc) {
        //the memory handler might have emptied this 
        if (!MR.Controls.onChange)
            MR.Controls.onChange = new Array();
        if (!MR.Controls.onChange[AelementId])
            MR.Controls.onChange[AelementId] = new Array();

        //prevent duplicates
        for (var i = 0; i < MR.Controls.onChange[AelementId].length; i++) {
            if (MR.Controls.onChange[AelementId][i].toString() == AChangefunc.toString())
                return;
        }
        MR.Controls.onChange[AelementId][MR.Controls.onChange[AelementId].length] = AChangefunc;
    },

    /****m* Events/checkOnChange 
	* NAME
	* checkOnChange 
	*
	* USAGE
	* MR.Events.checkOnChange(string AelementId)
	****/
    checkOnChange: function (AelementId) {
        //the memory handler might have emptied this 
        if (MR.Controls.onChange) {
            if (MR.Controls.onChange[AelementId] && MR.Controls.onChange[AelementId].length > 0) {
                for (var i = 0; i < MR.Controls.onChange[AelementId].length; i++) {
                    try {
                        if (typeof MR.Controls.onChange[AelementId][i] == 'function')
                            MR.Controls.onChange[AelementId][i]();
                        else if (typeof MR.Controls.onChange[AelementId][i] == 'string')
                            eval(MR.Controls.onChange[AelementId][i]);
                    }
                    catch (err) {
                        if (MR.IdValue.get('debugging', 'enabled')) alert(err);
                    }
                }
            }
        }
    },

    /****m* Events/clearOnChange 
* NAME
* addOnChange
*
* DESCRIPTION
* Removes all functions associated with 'onChange' on this element.
* USAGE
* MR.Events.clearOnChange(string AelementId);
****/
    clearOnChange: function (AelementId) {
        MR.Controls.onChange[AelementId] = null;
    },

    /****h* Events/handler
	* NAME
	* handler 
	*
	****/
    handler:
	{
	    /****m* handler/add
		* NAME
		* add 
		*
		* USAGE
		* MR.Events.handler.add (AtrgtElement, AeventType, AeventCode [,AstopBubble] );
		*
		* ARGUMENTS
		* * AtrgtElement -- Name of the argument to be passed with the request.
		* * AeventType -- W3 event description (ie. 'click' and not 'onclick'), accepts list of ';' seperated event types (ie. 'click;change').
		* * AeventCode -- Function to be executed when the event is triggered.
		*
		* OPTIONS
		* * AstopBubble -- Boolean of wether event propagation should be stopped this element or not.
		****/
	    add: _addEventHandler,

	    /****m* handler/remove
		* NAME
		* remove
		*
		****/
	    remove: _removeEventHandler
	},

    /****m* Events/mousePos
	* NAME
	* mousePos
	*
	* DESCRIPTION
	* Returns a tuple (X,Y) with the current coordinates of the mouse cursor relative to the windowframe.
	*
	* ARGUMENTS
	* * Ae -- The event that the position should be read from.
	* * ArefPoint -- element or element id where the event originated.
	*****/
    mousePos: function (Ae, ArefPoint) {
        var posx = 0;
        var posy = 0;
        if (!e) var e = window.event;
        if (Ae.pageX || Ae.pageY) {
            posx = Ae.pageX;
            posy = Ae.pageY;
        }
        else if (Ae.clientX || Ae.clientY) {
            posx = Ae.clientX + document.body.scrollLeft
				+ document.documentElement.scrollLeft;
            posy = Ae.clientY + document.body.scrollTop
				+ document.documentElement.scrollTop;
        }
        return { X: posx, Y: posy };
    },

    /****h* Events/fileUpload 
	* NAME
	* fileUpload
	*
	****/

    fileUpload:
	{
	    /****m* fileUpload/responseHandler
        * NAME
        * responseHandler
        *
        * USAGE
        * MR.Events.fileUpload.responseHandler(string AdbId, string AidentityToken)
        ****/
	    responseHandler: function (AdbId, AidentityToken) {
	        if (AdbId != 0) {
	            MR.Controls.fileUploads[AidentityToken](AdbId, AidentityToken);
	        }
	        else {
	            alert("Upload af fil mislykkedes.");
	        }
	    },

	    /****m* fileUpload/trigger
        * NAME
        * trigger
        *
        * USAGE
        * MR.Events.fileUpload.trigger(Event Wevent, Element AtrgtFrame, string AdummyID)
        ****/
	    trigger: function (Wevent, AtrgtFrame, AdummyID) {
	        var Welement = MR.getId('uploadTrigger');
	        dummyFileopload = MR.getId(AdummyID);
	        formFileOpload = dummyFileopload.parentNode;

	        if (!Welement) {
	            Welement = document.createElement("input");
	            Welement.setAttribute("type", "file");
	            Welement.id = "uploadTrigger";
	            Welement.setAttribute("name", AdummyID);
	            formFileOpload.appendChild(Welement);
	        }
	        minYFileOpload = MR.Styles.findPos(dummyFileopload).Y - MR.Styles.innerScroll(dummyFileopload).Y;
	        minXFileOpload = MR.Styles.findPos(dummyFileopload).X;
	        maxYFileOpload = minYFileOpload + dummyFileopload.offsetHeight;
	        maxXFileOpload = minXFileOpload + dummyFileopload.offsetWidth;

	        tmpFunFileOpload = function () {

	            var Welement = MR.getId("uploadTrigger");
	            var We = arguments[0];
	            if (!We)
	                We = window.event;
	            var WmPos = MR.Events.mousePos(We);
	            if (Welement != null && (WmPos.Y < minYFileOpload || WmPos.Y > maxYFileOpload || WmPos.X < minXFileOpload || WmPos.X > maxXFileOpload)) {
	                MR.Events.handler.remove(document, "mousemove", tmpFunFileOpload);
	                if (Welement.value && Welement.value.length > 0)
	                    formFileOpload.submit();
	                Welement.parentNode.removeChild(Welement);
	            }
	            else if (Welement != null) {
	                var x = 0;
	                var y = 0;
	                var Wfframe = getFrame(dummyFileopload);

	                if (Wfframe && MR.Styles.reader(Wfframe).position == 'absolute') {
	                    y = MR.Styles.findPos(Wfframe).Y;
	                    x = MR.Styles.findPos(Wfframe).X;
	                }
	                Welement.style.top = (WmPos.Y - y - 12) + 'px';
	                Welement.style.left = (WmPos.X - x - 210) + 'px';
	            }
	        }
	        MR.Events.handler.add(document, "mousemove", tmpFunFileOpload);
	    }
	}
}

/****m* MR/directCall
* NAME
* directCall
*
* USAGE
* MR.directCall(AwebmethodName [,AviewValues [,AaddArgs [,AserviceURI ]]])
****/
MR.directCall = function (AwebmethodName, AviewValues, AaddArgs, AserviceURI, aInteractive) {
    var Wrequest = new MR.Request(AwebmethodName, AwebmethodName, AserviceURI || "Services.asmx", undefined, aInteractive || true);

    //add any additional vars
    if (AviewValues && AviewValues.length > 0) {
        var Wviews = AviewValues.split(';')
        var Welement;
        for (var i = 0; i < Wviews.length; i++) {
            if (Wviews[i].length > 0)
                Wrequest.getInputValues(Wviews[i]);
        }
    }
    if (AaddArgs && AaddArgs.length > 0) {
        var Wargs = AaddArgs.split(';')
        for (var j = 0; j < Wargs.length; j++) {
            Wargs[j] = Wargs[j].replace('::', '||||');
            try {
                Wrequest.addArg(Wargs[j].split(':')[0].replace('||||', ':'), Wargs[j].split(':')[1].replace('||||', ':'));
            }
            catch (e) { }
        }
    }
    Wrequest.submit();
}

/*
function DOM()
{

}
*/
SOAPrequest = MR.Request;


MR.Map =
{
    areaSearch: function (Aevent, AfollowUpMethod) {
        var WsrcElement = Aevent.srcElement ? Aevent.srcElement : Aevent.originalTarget;

        var scrollXY = MR.Styles.windowScroll();

        MR.Controls.map.dragStart =
        {
            //X:Aevent.offsetX || 
            X: (Aevent.clientX - MR.Styles.findPos(WsrcElement).X + scrollXY.X),
            //Y:Aevent.offsetY || 
            Y: (Aevent.clientY - MR.Styles.findPos(WsrcElement).Y + scrollXY.Y)
        }


        MR.Controls.map.dragStartAbsolute = { X: Aevent.screenX, Y: Aevent.screenY }

        //
        var WdrawRect = function () {
            try {
                var Wrect = MR.getId('mapSearchRect');
                if (Wrect) {
                    var Wwidth = (
                        arguments[0].screenX
                        - MR.Controls.map.dragStartAbsolute.X);
                    var Wheight = (
                        arguments[0].screenY
                        - MR.Controls.map.dragStartAbsolute.Y);
                    var Wbw = Number(MR.Styles.reader(Wrect).borderWidth.split('px')[0]);
                    //Wbw = 10;
                    if (Wwidth < 0) {
                        Wrect.style.left = (MR.Controls.map.dragStart.X + Wwidth + Wbw - 1) + 'px';
                        Wrect.style.width = (-1 * Wwidth - Wbw) + 'px';
                    }
                    else {
                        Wrect.style.left = (MR.Controls.map.dragStart.X - Wbw) + 'px';
                        Wrect.style.width = (Wwidth - Wbw) + 'px';
                    }

                    if (Wheight < 0) {
                        Wrect.style.top = (MR.Controls.map.dragStart.Y + Wheight + Wbw - 1) + 'px';
                        Wrect.style.height = (-1 * Wheight - Wbw) + 'px';
                    }
                    else {
                        Wrect.style.top = (MR.Controls.map.dragStart.Y) + 'px';
                        Wrect.style.height = (Wheight - 2 * Wbw) + 'px';
                    }
                }
            }
            catch (e)
            { }
        }
        var Wmu = function () {
            var WendEvent = arguments[0];
            //calculate the coordinates
            var Wm = MR.Controls.map;

            MR.Controls.map.lastSelect = new Array();

            var WmDeltaX = WendEvent.screenX - Wm.dragStartAbsolute.X;
            var WmDeltaY = WendEvent.screenY - Wm.dragStartAbsolute.Y;
            if (WmDeltaX <= 0) {
                if (WmDeltaX > -10) {
                    WmDeltaX = -10;
                    Wm.dragStart.X += 5;
                }
                MR.Controls.map.lastSelect.minX = (Wm.dragStart.X + WmDeltaX) / Wm.mapwidth * Wm.dx + Number(Wm.minx);
                MR.Controls.map.lastSelect.maxX = Wm.dragStart.X / Wm.mapwidth * Wm.dx + Number(Wm.minx);
            }
            else {
                if (WmDeltaX < 10) {
                    WmDeltaX = 10;
                    Wm.dragStart.X -= 5;
                }
                MR.Controls.map.lastSelect.maxX = (Wm.dragStart.X + WmDeltaX) / Wm.mapwidth * Wm.dx + Number(Wm.minx);
                MR.Controls.map.lastSelect.minX = Wm.dragStart.X / Wm.mapwidth * Wm.dx + Number(Wm.minx);
            }
            if (WmDeltaY < 0) {
                if (WmDeltaY > -10) {
                    WmDeltaY = -10;
                    Wm.dragStart.Y += 5;
                }
                MR.Controls.map.lastSelect.minY = Number(Wm.maxy) - ((Wm.dragStart.Y) / Wm.mapheight * Wm.dy);
                MR.Controls.map.lastSelect.maxY = Number(Wm.maxy) - ((Wm.dragStart.Y + WmDeltaY) / Wm.mapheight * Wm.dy);
            }
            else {
                if (WmDeltaY < 10) {
                    WmDeltaY = 10;
                    Wm.dragStart.Y -= 5;
                }
                MR.Controls.map.lastSelect.maxY = Number(Wm.maxy) - (Wm.dragStart.Y / Wm.mapheight * Wm.dy);
                MR.Controls.map.lastSelect.minY = Number(Wm.maxy) - ((Wm.dragStart.Y + WmDeltaY) / Wm.mapheight * Wm.dy);
            }
            MR.Events.handler.remove(WsrcElement.id, 'mouseup', Wmu);
            MR.Events.handler.remove(document, 'mousemove', WdrawRect);
            var Wrect = MR.getId('mapSearchRect');
            Wrect.parentNode.style.cursor = 'auto';
            Wrect.parentNode.removeChild(Wrect);
            AfollowUpMethod();
        }
        WsrcElement.appendChild(document.createElement('span'));
        WsrcElement.lastChild.id = 'mapSearchRect';
        WsrcElement.lastChild.style.width = '0px';
        WsrcElement.lastChild.style.height = '0px';
        WsrcElement.style.cursor = 'crosshair';
        /*        WsrcElement.lastChild.style.top = MR.Controls.map.dragStart.Y;
                WsrcElement.lastChild.style.left = MR.Controls.map.dragStart.X; */
        MR.Events.handler.add(WsrcElement, 'mouseup', Wmu);
        MR.Events.handler.add(document, 'mousemove', WdrawRect, true);
    }
}

//wrapper for document.getElementById to save a few chars
MR.getId = function (Aid) {
    return document.getElementById(Aid);
}

//function sfHover(){};



/***** Treeview *****/

function treeviewClickNode(ATreeviewId, AWebMethod, ANodeId, ALevel, AReplaceDivId) {
    var Request = new MR.Request(AWebMethod, AWebMethod, "Services.asmx");
    Request.addArg('TreeviewId', ATreeviewId, 'hiddenFields');
    Request.addArg('WebMethod', AWebMethod, 'hiddenFields');
    Request.addArg('NodeId', ANodeId, 'hiddenFields');
    Request.addArg('Level', ALevel, 'hiddenFields');
    Request.addArg('ReplaceDivId', AReplaceDivId, 'hiddenFields');


    var ImgId = ATreeviewId + "_" + ANodeId + "_FoldImg";
    var ImgDiv = document.getElementById(ImgId);
    var ImgUrl = ImgDiv.style.backgroundImage;
    if (ImgUrl.indexOf("Minus") > 0) {
        Request.addArg('Expand', '0', 'hiddenFields');
        ImgDiv.style.backgroundImage = "url(Monorail/graphics/tinyPlus.gif)";
    }
    else {
        Request.addArg('Expand', '1', 'hiddenFields');
        ImgDiv.style.backgroundImage = "url(Monorail/graphics/tinyMinus.gif)";
    }


    Request.getInputValues(ATreeviewId);
    Request.submit();
}


/* dropdownBox */

MR.closeDropdownBox = function () {
    var Box = document.getElementById('dropdownBoxExpand');
    if (Box) Box.parentNode.removeChild(Box);
}

MR.setDropdownBoxInput = function (AId, AText) {
    var ElemInput = document.getElementById(AId + '_input');
    if (ElemInput) {
        ElemInput.value = AText;
    }
}

MR.dropdownboxWebMethodExpand = '';
MR.dropdownboxWebMethodOk = '';
MR.dropdownboxAdditionalArgs = '';

function dropDownBoxExpand(AElementId, AShowSpinner, AShowAlleNulstil, AWebMethodExpand, AWebMetodOk, AAdditionalArgs, AExtraWidth, okText, chooseAllText, ResetText, cancelText) {
    MR.dropdownboxWebMethodExpand = AWebMethodExpand;
    MR.dropdownboxWebMethodOk = AWebMetodOk;
    MR.dropdownboxAdditionalArgs = AAdditionalArgs;

    MR.closeDropdownBox();

    var Elem = document.getElementById(AElementId);
    var ElemInput = document.getElementById(AElementId + '_input');
    if ((Elem) && (ElemInput)) {
        var ElemPos = MR.Styles.findPos(Elem);

        // Box div
        var BoxDiv = document.createElement('div');
        BoxDiv.setAttribute('id', 'dropdownBoxExpand');
        BoxDiv.style.position = 'absolute';
        BoxDiv.style.left = ElemPos.X + 'px';
        BoxDiv.style.top = (ElemPos.Y + 20) + 'px';
        BoxDiv.style.width = (ElemInput.clientWidth + AExtraWidth) + 'px';
        Elem.parentNode.appendChild(BoxDiv);

        // Button div top
        var BtnDiv = document.createElement('div');
        BtnDiv.setAttribute('id', 'dropdownBoxBtnDiv');

        dropDownBoxMakeBtns(BtnDiv, AShowAlleNulstil, AWebMetodOk, AAdditionalArgs, okText, chooseAllText, ResetText, cancelText);
        BoxDiv.appendChild(BtnDiv);

        // Content div
        var ContentDiv = document.createElement('div'); 
        ContentDiv.setAttribute('id', 'dropdownBoxContent');
        BoxDiv.appendChild(ContentDiv);

        // Spinner
        if (AShowSpinner) {
            var Spinner = document.createElement('img');
            Spinner.setAttribute('src', 'Monorail/graphics/spinner.gif');
            ContentDiv.appendChild(Spinner);
        }

        MR.directCall(MR.dropdownboxWebMethodExpand, '', MR.dropdownboxAdditionalArgs);
    }
}

function dropDownBoxMakeBtns(ABtnDiv, AShowAlleNulstil, AWebMetodOk, AAdditionalArgs, okText, chooseAllText, ResetText, cancelText) {

    var Ok = document.createElement('input');
    Ok.setAttribute('type', 'button');
    Ok.setAttribute('value', okText); //'OK'
    Ok.setAttribute('disabled', 'disabled');
    Ok.onclick = dropdownboxOk;
    ABtnDiv.appendChild(Ok);

    if (AShowAlleNulstil) {
        var VaelgAlle = document.createElement('input');
        VaelgAlle.setAttribute('type', 'button');
        VaelgAlle.setAttribute('value', chooseAllText); //'Vælg alle'
        VaelgAlle.setAttribute('disabled', 'disabled');
        VaelgAlle.onclick = dropdownboxVaelgAlle;
        ABtnDiv.appendChild(VaelgAlle);

        var Nulstil = document.createElement('input');
        Nulstil.setAttribute('type', 'button');
        Nulstil.setAttribute('value', ResetText); //'Nulstil'
        Nulstil.setAttribute('disabled', 'disabled');
        Nulstil.onclick = dropdownboxNulstil;
        ABtnDiv.appendChild(Nulstil);
    }

    var Fortryd = document.createElement('input');
    Fortryd.setAttribute('type', 'button');
    Fortryd.setAttribute('value', cancelText); //'Fortryd'
    Fortryd.onclick = MR.closeDropdownBox;
    Fortryd.setAttribute('disabled', 'disabled');
    ABtnDiv.appendChild(Fortryd);
}

function dropdownboxOk() {
    MR.directCall(MR.dropdownboxWebMethodOk, 'dropdownBoxExpand', MR.dropdownboxAdditionalArgs);
    MR.closeDropdownBox();
}

function dropdownboxEnabledButtons() {
    var BtnDiv = document.getElementById('dropdownBoxBtnDiv');
    if (BtnDiv) {
        var Inputs = BtnDiv.getElementsByTagName("input");
        for (var i = 0; i < Inputs.length; i++)
            Inputs[i].removeAttribute('disabled');
    }
}

function dropdownboxVaelgAlle() {
    var ContentDiv = document.getElementById('dropdownBoxContent');
    if (ContentDiv) {
        var Inputs = ContentDiv.getElementsByTagName("input");
        for (var i = 0; i < Inputs.length; i++)
            Inputs[i].checked = true;
    }
}

function dropdownboxNulstil() {
    var ContentDiv = document.getElementById('dropdownBoxContent');
    if (ContentDiv) {
        var Inputs = ContentDiv.getElementsByTagName("input");
        for (var i = 0; i < Inputs.length; i++)
            Inputs[i].checked = false;
    }
}