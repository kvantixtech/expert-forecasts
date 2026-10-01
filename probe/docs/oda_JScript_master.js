function MonorailErrorFunc(ErrorText) {
    //document.location= "ADFSKeepALive.aspx";
    alert(ErrorText);
}

/* Timeout */
var timeouttimer = null;
var loadBestilteHentDataTimer = null;

function ResetTimeout() {
    if (timeouttimer != null) clearTimeout(timeouttimer);
    MR.directCall('RefreshTimeout');
    timeouttimer = window.setTimeout("ResetTimeout();", 30000);
}

ResetTimeout();


function MakeRedirect() {
    if (timeouttimer != null) clearTimeout(timeouttimer);
    var d = new Date();
    document.location = 'ADFSKeepALive.aspx?q=' + d.getTime();
}

function RedirectTimeout() {
    if (timeouttimer != null) clearTimeout(timeouttimer);
    timeouttimer = window.setTimeout("MakeRedirect();", 2500);
}

/* Fjerne popup dics, så som flyovertekster og spinner divs*/
function RemovePopupDivs() {
    toolTipOff();
    RemoveBox('spin');
    RemoveBox('selectListBox');

    // Fjern multiselect bokse
    var divs = document.getElementsByTagName('div');
    for (var i = 0; i < divs.length; i++) {
        var item = divs[i];
        if (item.className == 'selectListBoxDiv')
            RemoveBox(item.id);
    }
}



/* Breadcrums */
function ShowBreadcrums() {
    var Wrequest = new MR.Request("Breadcrums_Show", "Breadcrums_Show", "Services.asmx");
    Wrequest.submit();
}

function SetBreadcrum(ALevel, AText) {
    var Wrequest = new MR.Request("Breadcrums_Set", "Breadcrums_Set", "Services.asmx");
    Wrequest.addArg('ALevel', ALevel, 'hiddenFields');
    Wrequest.addArg('AText', AText, 'hiddenFields');
    Wrequest.submit();
}

/* Favoritter */
function ShowFavorit(AFavId) {
    var Wrequest = new MR.Request("fav_ShowFavorit", "fav_ShowFavorit", "Services.asmx");
    Wrequest.addArg('FavId', AFavId, 'hiddenFields');
    Wrequest.submit();
}

function FavEditSave(AFavId, AEdit) {
    var Wrequest = new MR.Request("FavEditItemSave", "FavEditItemSave", "Services.asmx");
    Wrequest.addArg('FavId', AFavId, 'hiddenFields');
    Wrequest.addArg('Edit', AEdit, 'hiddenFields');
    Wrequest.getInputValues('EditFavWndInner');
    Wrequest.submit();
}


/* Hjælp */
function ShowHelp(e, url) {
    window.open(url, '_blank');
    e.stopPropagation && e.stopPropagation() || (e.cancelBubble = true);
    return false;
}

function ShowKontekstHelpWindow() {
    var wRequest = new MR.Request("help_ShowKontekstHelp", "help_ShowKontekstHelp", "Services.asmx")
    wRequest.submit();
}


/* Select bokse i SCL2 og Hent data */

function SCL2CheckEmptySelectList(AId, AddArgs) {
    if (document.getElementById(AId).value == "") {
        if (document.getElementById('SCL2HeaderDiv'))
            MR.directCall('SCL2_SelectSelectList', 'SCL2HeaderDiv', AddArgs);
        else
            MR.directCall('SCL2_SelectSelectList', 'HentDataKriterieDiv', AddArgs);
    }
}


function SCL2CheckEmptyPeriodSelectList(AId) {
    if (document.getElementById(AId).value == "") {
        if (document.getElementById('SCL2HeaderDiv'))
            MR.directCall('SCL2_SelectPeriodSelectList', 'SCL2HeaderDiv', AddArgs);
    }
}

/* Mulitselect dropdown bokse */

function MakeBox(AInputElement, AInsertedDivId) {
    var WeventSrc = MR.getId(AInputElement);
    var Wtrgt = MR.getId(AInsertedDivId);

    //position the selectListBox	
    Wtrgt.style.display = "none";//this element interferes with "findPos"
    var WsrcPos = MR.Styles.findPos(WeventSrc);
    Wtrgt.style.display = "block";

    Wtrgt.style.zIndex = parseInt(minZindex(WeventSrc)) + 1;

    if (Wtrgt.childNodes.length < 10)
        Wtrgt.style.height = 'auto';

    //position relative to the correct inputField
    Wtrgt.style.left = (window.event === null ? -1 : 0) + WsrcPos.X + 'px';
    Wtrgt.style.top = WsrcPos.Y + 19 + 'px';

    w = WeventSrc.clientWidth + 20;
    if (w < 250) w = 250;
    Wtrgt.style.width = w + 'px';
}

function RemoveBox(AID) {
    var WcloseMe = MR.getId(AID);
    if (!WcloseMe) return
    WcloseMe.parentNode.removeChild(WcloseMe);
}

function MultiselectBeforeSpinner(AEventSrc) {
    var AEventValue = AEventSrc + '-delcheck';
    if (document.getElementById(AEventValue).value == '*') {
        document.getElementById(AEventSrc).value = '';
        document.getElementById(AEventValue).value = '';
    }

    RemoveBox('spin');
    RemoveBox('selectListBox');
}


function CheckAllByParent(aId, aChecked) {
    if (aId != '') {
        var collection = document.getElementById(aId).getElementsByTagName('INPUT');
        for (var x = 0; x < collection.length; x++) {
            if (collection[x].type.toUpperCase() == 'CHECKBOX')
                collection[x].checked = aChecked;
        }

        collection = document.getElementById(aId).getElementsByTagName('DIV');
        for (var x = 0; x < collection.length; x++)
            CheckAllByParent(collection[x].id, aChecked);
    }
}


function PosMenuItems() {
    var MenuBar = document.getElementById('menuBar');
    var P = MR.Styles.findPos(MenuBar);

    // User navn
    var UserDiv = document.getElementById('UserDiv');
    if (UserDiv) {
        UserDiv.style.top = P.Y + "px";
        UserDiv.style.left = (P.X + MenuBar.clientWidth - UserDiv.clientWidth) + "px";
    }

    // ODA logo
    var ODALogo = document.getElementById('MiddleLogo');
    if (ODALogo)
        ODALogo.style.left = P.X + MenuBar.clientWidth / 2 - ODALogo.clientWidth / 2 + "px";

    // "IkkeDrift" skiltet
    var IkkeDrift = document.getElementById('IkkeDrift');
    if (IkkeDrift)
        IkkeDrift.style.left = P.X + MenuBar.clientWidth / 2 - IkkeDrift.clientWidth / 2 + "px";

    // Bestiltet data i HentData
    var BestilteHentData = document.getElementById('BestilteHentData');
    if (BestilteHentData) {
        BestilteHentData.style.left = P.X + 740 + "px";
    }
    LoadBestilteHentData();
    StartPolling();

    SetWindowSizeServer();
}

var saveWindowsSizeTimer = null;
function SetWindowSizeServer() {
    if (saveWindowsSizeTimer != null) clearTimeout(saveWindowsSizeTimer);
    saveWindowsSizeTimer = setInterval(function () {
        clearTimeout(saveWindowsSizeTimer);
        SetWindowSizeServerExec();
    }, 400);
}

function SetWindowSizeServerExec() {
    // Sæt window størrelse i session
    var Wrequest = new MR.Request("SetWindowSize", "SetWindowSize", "Services.asmx");
    Wrequest.addArg('WindowHeigth', $(window).height(), 'hiddenFields');
    Wrequest.addArg('WindowWidth', $("#outerFrame").width(), 'hiddenFields');
    Wrequest.submit();
    // RedrawGraphAfterResize kaldes fra SetWindowsSize
}


var RedrawGraphType = {
    SCL1: 1,
    SCL2: 2,
    SCL2Multi: 3,
    StoftransportInput: 4,
    StoftransportResDay: 5,
    StoftransportResMonth: 6,
    StoftransportResYear: 7,
    AdminDatakvalitet: 8
};

function RedrawGraphAfterResize() {
    var graphElemType = null;
    var graphElem;

    if (!graphElemType) {
        graphElem = $("#SCL1Graph_divgraph");
        if (graphElem.length > 0)
            graphElemType = RedrawGraphType.SCL1;
    }

    if (!graphElemType) {
        graphElem = $("#KvalGraph_divgraph");
        if (graphElem.length > 0) {
            graphElemType = RedrawGraphType.SCL2;
        }
    }

    if (!graphElemType) {
        graphElem = $("#KvalMultiGraph_divgraph");
        if (graphElem.length > 0) {
            graphElemType = RedrawGraphType.SCL2Multi;
        }
    }

    if (!graphElemType) {
        graphElem = $("#StoftransportInputGraph_divgraph");
        if (graphElem.length > 0)
            graphElemType = RedrawGraphType.StoftransportInput;
    }

    if (!graphElemType) {
        graphElem = $("#StoftransportResultGraphDay_divgraph");
        if (graphElem.length > 0)
            graphElemType = RedrawGraphType.StoftransportResDay;
    }

    if (!graphElemType) {
        graphElem = $("#StoftransportResultGraphMonth_divgraph");
        if (graphElem.length > 0)
            graphElemType = RedrawGraphType.StoftransportResMonth;
    }

    if (!graphElemType) {
        graphElem = $("#StoftransportResultGraphYear_divgraph");
        if (graphElem.length > 0)
            graphElemType = RedrawGraphType.StoftransportResYear;
    }

    if (!graphElemType) {
        graphElem = $("#DatakvalitetGraph_divgraph");
        if (graphElem.length > 0)
            graphElemType = RedrawGraphType.AdminDatakvalitet;
    }


    if (graphElemType) {
        switch (graphElemType) {
            case RedrawGraphType.SCL1:
                MR.directCall('topic_scl1_graphdatechange', 'SCL1GraphDateDiv');
                break;
            case RedrawGraphType.SCL2:
                MR.directCall('SCL2_MakeGraph');
                break;
            case RedrawGraphType.SCL2Multi:
                MR.directCall('SCL2_RenderMultigraph');
                break;
            case RedrawGraphType.StoftransportInput:
                MR.directCall('BeregningTabInput');
                break;
            case RedrawGraphType.StoftransportResDay:
                MR.directCall('BeregningTabResultatDag');
                break;
            case RedrawGraphType.StoftransportResMonth:
                MR.directCall('BeregningTabResultatMaaned');
                break;
            case RedrawGraphType.StoftransportResYear:
                MR.directCall('BeregningTabResultatAar');
                break;
            case RedrawGraphType.AdminDatakvalitet:
                MR.directCall('Datakvalitet_MakeGraphFill');
                break;
        }
    }
    PositionGraphNoData();
}

function PositionGraphNoData() {
    var noDataDivs = $(".graphnodata");
    for (var i = 0; i < noDataDivs.length; i++) {
        var nodata = noDataDivs[i];
        var graphdiv = $(nodata).parent();

        var pos = graphdiv.offset();
        $(nodata).css("top", pos.top + "px");
        $(nodata).css("left", (pos.left + 50) + "px");
    }
}

function StartPolling() {
    if (loadBestilteHentDataTimer != null) clearTimeout(loadBestilteHentDataTimer);
    loadBestilteHentDataTimer = setInterval(function () {
        LoadBestilteHentData();
    }, 15000);
}


function LoadBestilteHentData() {
    MR.directCall('GetBestilteHentData');
}

function ResizeDataTables() {
    $(".dataTable").each(function () {
        var table = $(this).DataTable();
        table.columns.adjust().draw();
    });
}


/* Favoritter */
function ShowFav() {
    if (document.getElementById('light')) document.getElementById('light').className = '';
    MR.directCall('menu_redraw', '', 'add:true');
}

function HideFav() {
    if (document.getElementById('light')) document.getElementById('light').className = 'hidden';
    MR.directCall('menu_redraw', '', 'add:false');
}

function SetOnclickFav(AOnclick) {
    MR.directCall('help_UpdateFavIcon', '', 'onclick:' + AOnclick);
}




/* Flyover tekster */
function SetFlyover(Id, FlyoverTekst) {
    addToolTip(Id, FlyoverTekst);
}



/* OSL */
var OSLDisableIdList;
var ObsStedId;

function OSLSelected(ObsStedSelected) {
    if ($('#OSLObsStedPopup').length > 0) $('#OSLObsStedPopup').remove();

    $(document.body).append('<div id="OSLObsStedPopup">Vælg observationsstednr</div>');
    var ObsPos = $('#' + ObsStedId).offset();
    ObsPos.top += 25;
    ObsPos.left += 240;
    $('#OSLObsStedPopup').offset(ObsPos);
    $('#OSLObsStedPopup').fadeIn();
    setInterval(function () { $('#OSLObsStedPopup').fadeOut(); }, 5000);
}

function OSLObsStedSelected() {
    for (var i = 0; i < OSLDisableIdList.length; i++) {
        $("#" + OSLDisableIdList[i]).css('color', '#000000');
        $("#" + OSLDisableIdList[i] + " :input").removeAttr('disabled');
        $("#" + OSLDisableIdList[i] + " :input").css('color', '#000000');
    }
}

function SetSectionHeading(SecId, Heading) {
    $("#" + SecId + " legend").text(Heading);
}


var GisBtnArray = [];
function PosGisBtn(ObsStedId, GisImgId) {
    var obj = { ObsStedId: ObsStedId, GisImgId: GisImgId };
    GisBtnArray.push(obj);

    // Lidt dårlig løsning. Skal laves om når vi skifter monorail komponenterne ud
    setTimeout(function () { PosGisBtnExec(ObsStedId, GisImgId); }, 200);
    setTimeout(function () { PosGisBtnExec(ObsStedId, GisImgId); }, 500);
    setTimeout(function () { PosGisBtnExec(ObsStedId, GisImgId); }, 1500);
    setTimeout(function () { PosGisBtnExec(ObsStedId, GisImgId); }, 2000);
    setTimeout(function () { PosGisBtnExec(ObsStedId, GisImgId); }, 2500);
}

function PosGisBtnExec(ObsStedId, GisImgId) {
    var ObsStedInput = $('#' + ObsStedId);
    var GisImgBtn = $('#' + GisImgId);

    if ((ObsStedInput.length > 0) && (GisImgBtn.length > 0)) {
        var ObsPos = ObsStedInput.offset();
        ObsPos.left += ObsStedInput.width() + 5;
        GisImgBtn.offset(ObsPos);
    }
}

function PosGisBtnAfterResize() {
    for (var i = 0; i < GisBtnArray.length; i++) {
        PosGisBtnExec(GisBtnArray[i].ObsStedId, GisBtnArray[i].GisImgId);
    }
}


// Bruges til at stoppe igangværende Ajax request i gis vinduet hvis det lukkes
function GisKillAjaxRequest() {
    var GisFrame = document.getElementById("GisWndIFrame");
    if (GisFrame) {
        try {
            GisFrame.contentWindow.KillAjaxRequest();
        } catch (e) {
            // Gør intet
        }
    }
}


function GisStationerValgt(ObsStedControl) {
    setTimeout(function () {
        if (ObsStedControl) {
            $("#" + ObsStedControl.UIId).val(ObsStedControl.UIText);
        };
        MR.directCall('HentData_KritChanged');
        GisWndClose();
    }, 100);
}

function GisWndClose() {
    $('#GisWnd').dialog('destroy').remove();
}

function GisVisIKortSelect(stationsId, stationsNavn, stationsFuldtNavn) {
    var Wrequest = new MR.Request("Gis_OpenGraf", "Gis_OpenGraf", "Services.asmx");
    Wrequest.addArg('StationsId', stationsId, 'hiddenFields');
    Wrequest.addArg('StationsNr', stationsNavn, 'hiddenFields');
    Wrequest.addArg('StationsNavn', stationsFuldtNavn, 'hiddenFields');
    Wrequest.submit();
}

function GisVisIKortResize(stationsId) {
    GisVisIKortResizeExecute(stationsId);
    setTimeout("GisVisIKortResizeExecute(" + stationsId + ")", 500);
}

function GisVisIKortResizeExecute(stationsId) {
    var GraphWnd = $("#StationsGraf_" + stationsId);
    var GraphDiv = $("#KvalGraph_" + stationsId + "_divgraph");
    var Shadow = $("#StationsGraf_" + stationsId + "-shadow");

    GraphWnd.height(GraphDiv.height() + 55);
    GraphWnd.width(GraphDiv.width() + 15);

    Shadow.height(GraphWnd.height() + 2);
    Shadow.width(GraphWnd.width() + 2);
}



/* Datatables hjælpefunktioner */

function DTBasicRender(data, align, color, img, cssClass) {
    var cell = "<div";
    if (align == 1) cell += " class='DynamiskCellRight'";
    if (align == 2) cell += " class='DynamiskCellCenter'";

    var style = "";
    if (color) style += "background-color:#" + color + ";";
    if (img) style += "background-image:url(images/" + img + ");";
    if (style != "") cell += " style='" + style + "'";
    if (cssClass) cell += " class='" + cssClass + "'";

    cell += ">";
    cell += data;
    cell += "</div>";
    return cell;
}

function DTCheckboxRender(data, ctrlId, onClickEvent, cssClass, isReadOnly) {
    var cell = "";
    if (data != "") {
        cell = "<div";
        if (cssClass) cell += " class='" + cssClass + "'";
        cell += ">";

        var ctrl = "";
        if (data == "CheckAll") {
            ctrl = "<img src='images/checkbox.gif'";
            if (ctrlId)
                ctrl += " id=\"" + ctrlId + "\"";
            if (onClickEvent)
                ctrl += " onclick=\"" + onClickEvent + "\"";
            ctrl += "/>";

        } else {
            ctrl = "<input id='" + ctrlId + "'";
            ctrl += " type='checkbox'";
            if (onClickEvent)
                ctrl += " onclick=\"" + onClickEvent + "\"";
            if (data == "1")
                ctrl += " checked='true'";
            if (isReadOnly == "1")
                ctrl += " disabled=disabled";
            ctrl += " />";
        }
        cell += ctrl;

        cell += "</div>";

        if (ctrlId)
            DTSetFlyover(ctrlId);
    }
    return cell;
}

function DTImgListRender(data, onClickEvent, imgId, cssClass) {
    var cell = "";
    if (data != "") {
        cell = "<div";
        if (cssClass) cell += " class='" + cssClass + "'";
        cell += ">";

        for (var i = 0; i < data.length; i++) {
            var ctrl = "<img src ='images/" + data[i] + "'";
            if (onClickEvent[i] != "")
                ctrl += " onclick=\"" + onClickEvent[i] + "\"";
            if (imgId[i] != "") {
                ctrl += " id=\"" + imgId[i] + "\"";
                DTSetFlyover(imgId[i]);
            }
            ctrl += " />";

            cell += ctrl;
        }

        cell += "</div>";
    }

    return cell;
}

function DTRowCreated(row, rowId, rowCssClass, rowStyle, rowOnClick) {
    if (rowId) $(row).attr('id', rowId);
    if (rowCssClass) $(row).addClass(rowCssClass);
    if (rowOnClick) $(row).attr('style', rowStyle);
    if (rowOnClick) $(row).attr('onclick', rowOnClick);
}

function DTOnOrder(tableId) {
    var table = $("#" + tableId).DataTable();
    var order = table.order();
    var columns = table.settings().init().columns;


    var sortFields = "";
    for (var i = 0; i < order.length; i++) {
        if (sortFields !== "") sortFields += ";";
        var orderColIdx = order[i][0];
        var orderType = order[i][1];

        sortFields += "field" + i + ":" + columns[orderColIdx].data + ";";
        sortFields += "fieldOrder" + i + ":" + orderType;
    }

    MR.directCall('DTOnSort', '', sortFields);
}

var DTFlyoverList = [];

function DTSetFlyover(ctrlId) {
    DTFlyoverList.push(ctrlId);
}

function DTExecuteFlyover() {
    var ctrlIdList = DTFlyoverList.join();
    MR.directCall('DTMakeFlyover', '', 'CtrlIdList:' + ctrlIdList);
    DTFlyoverList = [];
}

/* Oprettelse af datapicker */

function DatepickerInit(id, startValue, onChange, startYear, endYear) {
    var elem = $("#" + id);
    elem.datepicker({
        dayNamesMin: ['Sø', 'Ma', 'Ti', 'On', 'To', 'Fr', 'Lø'],
        monthNames: ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'],
        firstDay: 1,
        weekHeader: 'Uge',
        dateFormat: 'dd-mm-yy',
        changeMonth: true,
        changeYear: true,
        yearRange: startYear + ":" + endYear,
        showOn: "button",
        buttonImage: "MonoRail/graphics/calendar_icon.gif",
        buttonImageOnly: true,
        buttonText: "Select date"
    });
    if (startValue) {
        elem.datepicker('setDate', startValue);
    }
    if (onChange) {
        elem.change(eval(onChange));
    }
}

/* Button */
function ButtonInit(id, onClick, disabled) {
    var elem = $("#" + id);
    elem.button().click(onClick);
    if (disabled)
        elem.attr("disabled", "disabled");
}



/* Dropdown boks */
function DropdownInit(id, AjaxDataURL, startId, startValue, onChange) {
    var elem = $("#" + id);
    elem.autocomplete({
        source: AjaxDataURL,
        select: function (event, ui) {
            alert(ui.item.id + "-" + ui.item.value);
        }
    });
}

/* Window */

function SetWindowZIndex(wndId, zIndex) {
    var wnd = $("#" + wndId).parent();
    wnd.css("z-index", zIndex + 1);
    wnd.next().css("z-index", zIndex);
}

/* Eksport */
var EksportURL;
function MakeEksport(BtnId, FileType, EksportType) {
    var btn = $("#" + BtnId);
    var offset = btn.offset();
    var top = Math.round(offset.top - $(document).scrollTop()) + 3;
    var left = Math.round(2 * (offset.left - $(document).scrollLeft() + btn.width()) / 2) - 24;

    var spinner = $("<div id='DownloadSpinner' style='position:fixed;left:" + left + "px;top:" + top + "px'><img src='images/spinner.gif'></div>");
    $("body").append(spinner);

    switch (FileType) {
        case 'csv':
            EksportURL = 'getcsv.aspx?type=' + EksportType;
            break;
        case 'pdf':
            EksportURL = 'getpdf.aspx?type=' + EksportType;
            break;
        case 'xsl':
            EksportURL = 'getExcel.aspx?type=' + EksportType;
            break;
        default:
    }

    MR.directCall('InitEksport');
}

function StartEksport() {
    document.location = EksportURL;
    CheckEksportDone();
}

function CheckEksportDone() {
    setTimeout(function () { MR.directCall('CheckEksportDone'); }, 1000);
}

function EksportDone() {
    $("#DownloadSpinner").remove();
}

// Personlig OSL

var curOSLId = null;
var curOSLNavn = null;

function PersonligOSLInit() {
    curOSLId = null;
    curOSLNavn = null;
}


function PersonligOSLTilfoej(elementDivId) {
    var val = $("#PersonligOSLNavn").val();
    if (val) {
        var Wrequest = new MR.Request("AdminOSL_Ny", "AdminOSL_Ny", "Services.asmx");
        Wrequest.addArg('OSLNavn', val, 'hiddenFields');
        Wrequest.getInputValues(elementDivId);
        Wrequest.submit();
    }
}

function PersonligOSLOverskriv(elementDivId, overskrivType) {
    var val = $("#selEksisterendeOSL").val();
    if (val) {
        var onConfirm = function() {
            var Wrequest = new MR.Request("AdminOSL_Overskriv", "AdminOSL_Overskriv", "Services.asmx");
            Wrequest.addArg('OSLId', val, 'hiddenFields');
            Wrequest.addArg('OverskrivType', overskrivType, 'hiddenFields');
            Wrequest.getInputValues(elementDivId);
            Wrequest.submit();
        }
        ConfirmWnd("Er du sikker på vil overskrive?", onConfirm);
    }
}

function PersonligOSLSetEnabled() {
    $('#PersonligOSLNy').hide();
    $('#PersonligOSLRediger').hide();
    $("#btnPersonligOSLOSlet").button();
    if (curOSLId) {
        $("#btnPersonligOSLOSlet").button("option", "disabled", false);
        $('#PersonligOSLRediger').show();
    } else {
        $("#btnPersonligOSLOSlet").button("option", "disabled", true);
        $('#PersonligOSLNy').show();
    }

}

function PersonligOSLRedigerNavn() {
    var newNavn = $("#PersonligOSLNavn").val();
    if (newNavn !== curOSLNavn) {
        curOSLId = null;
        curOSLNavn = null;
        $("#selEksisterendeOSL option:selected").removeAttr("selected");
        PersonligOSLSetEnabled();
    }
}

function PersonligOSLRediger() {
    curOSLId = $("#selEksisterendeOSL").val();
    curOSLNavn = $("#selEksisterendeOSL option:selected").text();

    $("#PersonligOSLNavn").val(curOSLNavn);
    PersonligOSLSetEnabled();


}

function PersonligOSLSlet() {

    if (curOSLId) {
        var OnConfirm = function () {
            var Wrequest = new MR.Request("AdminOSL_Slet", "AdminOSL_Slet", "Services.asmx");
            Wrequest.addArg('OSLId', curOSLId, 'hiddenFields');
            Wrequest.submit();
            curOSLId = null;
            curOSLNavn = null;
            $("#PersonligOSLNavn").val("");
            PersonligOSLSetEnabled();
        }

        ConfirmWnd("Er du sikker på du vil slette?", OnConfirm);
    }
}


/* Confirm */

function ConfirmWnd(message, onConfirm, onCancel) {
    var wnd = $("<div title='Bektræft'><p><span>" + message + "</span></p></div>");
    wnd.dialog({
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "Ja": function () {
                if (onConfirm) onConfirm();
                $(this).dialog("close");
            },
            "Nej": function () {
                if (onCancel) onCancel();
                $(this).dialog("close");
            }
        }
    });
}

/* Language */
function SetLanugage(languageCode) {
    var request = new MR.Request("SetLanguage", "SetLanguage", "Services.asmx");
    request.addArg('languageCode', languageCode, 'hiddenFields');
    request.submit();

    /*
    setTimeout(function () {
    }, 100);
    */
} 

function SetLanguageReload() {
    if (window.location.href.includes("lang=en")) {
        const newUrl = window.location.href.replace(/([?&])lang=en(&|$)/, (match, p1, p2) => {
            return p1 === '?' || p2 === '&' ? p1 : '';
        }).replace(/[\?&]$/, ''); // Clean up trailing ? or &
        window.history.replaceState({}, document.title, newUrl);
    }

    location.reload();
}