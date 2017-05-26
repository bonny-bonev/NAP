var timeout = 100;
var ibAssistantId = "ibAssistant";
var napAssistantId = "napAssistant";
var currentAssistantId = null;

function initialize() {
    var ibTradesElement = $("div[id^='tblTransactions']");
    var napFormsElement = $("#decpart");

    var elementsToAppend = [];
    if(ibTradesElement.length > 0) {
        currentAssistantId = ibAssistantId;
        elementsToAppend.push($("<div style='display: block; margin: 0 auto; margin-top: 5px; text-align:center'>IB transactions form detected</div>"));
        var loadBtn = $("<div id='assistantBtn' style='display: block; background-color: #ced7e3; margin: 0 auto; margin-top: 15px; margin-bottom: 5px; text-align:center; cursor: pointer;'>Load IB trades info</div>");
        loadBtn.click(load);
        elementsToAppend.push(loadBtn);
    }
    else if(napFormsElement.length > 0) {
        currentAssistantId = napAssistantId;
        var trades = GM_getValue("IBconverted", null);
        elementsToAppend.push($("<div style='display: block; margin: 0 auto; margin-top: 5px; text-align:center'>NAP form detected</div>"));
        if(trades && trades.length > 0) {
            var fillBtn = $("<div id='assistantBtn' style='display: block; background-color: #ced7e3; margin: 0 auto; margin-top: 15px; margin-bottom: 10px; text-align:center; cursor: pointer;'>Fill NAP data</div>");
            fillBtn.click(fillNapInfo);
            elementsToAppend.push(fillBtn);
        } else {
            elementsToAppend.push($("<div style='display: block; background-color: #ced7e3; margin: 0 auto; margin-top: 15px; margin-bottom: 10px; text-align:center; cursor: no-drop;'>No trades loaded from IB</div>"));
        }
    }
    else{
        setTimeout(initialize, timeout);
        return;
    }

    var assistantDiv = createAssistantElement(currentAssistantId);
    for(var i = 0; i < elementsToAppend.length; i++) {
        assistantDiv.append(elementsToAppend[i]);
    }
    $("body").append(assistantDiv);
}

function setMessage(message) {
    var currentAssistant = $("#" + currentAssistantId);
    currentAssistant.find("#assistantBtn").html(message);
}

function createAssistantElement(id) {
    var helpElementWidth = 250;
    var helpElementPosition = $(window).width() - helpElementWidth - 15;
    return $("<div id='" + id + "' style='z-index: 1000; display: block; width: " + helpElementWidth + "px; background-color: white; border:5px solid #006699; position: fixed; left:" + helpElementPosition + "px; top: 5px;'></div>");
}

function fillNapInfo() {
    var trades = GM_getValue("IBconverted", null);
    for(var i = 0; i < trades.length; i++) {
        var trade = trades[i];
        var id = "A5D2";
        var mytable = _get_table_element(id);
        var rowNum = _getDynamicElementCount(id, mytable) + 1;
        addDynamicElement(id);

        $("<div>" + trade.Name + "</div>").insertBefore(getNapRowControl(id, rowNum, 'code'));
        getNapRowControl(id, rowNum, 'code').val('508');
        getNapRowControl(id, rowNum, 'isforeign').prop("checked", true);
        var usDate = trade.Date.split(",")[0];
        var usDateParts = usDate.split('-');
        var bgDate = usDateParts[2] + "." + usDateParts[1] + "." + usDateParts[0];
        getNapRowControl(id, rowNum, 'transferdate_display').val(bgDate);
        var sellValue = Math.abs(trade.Price).toFixed(2);
        var sellValueControl = getNapRowControl(id, rowNum, 'sellvalue');
        sellValueControl.val(sellValue);
        sellValueControl.blur();
        var buyValueInput = getNapRowControl(id, rowNum, 'buyvalue');
        buyValueInput.val(Math.abs(trade.BasePrice).toFixed(2));
        buyValueInput.blur();
    }
}

function getNapRowControl(napUniqueId, rowNum, name) {
    return $('#' + napUniqueId + '\\:' + rowNum + '_' + name);
}

function convertTradeRates() {
    var trades = GM_getValue("IB", null);
    var convertedTrades = [];
    if(trades) {
        for(var i = 0; i < trades.length; i++) {
            var getit = (currentTrade) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: "http://www.investor.bg/forex/calculator/",
                    data: "date=" + currentTrade.Date.split(",")[0] + "&currency_from=4&currency_to=0&quantity=1",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                    },
                    onload: function(response) {
                        var rate = parseFloat(JSON.parse(response.response).html);
                        var convertedTrade = {};
                        convertedTrade.Name = currentTrade.Name;
                        convertedTrade.Date = currentTrade.Date;
                        convertedTrade.Price = rate * currentTrade.Price;
                        convertedTrade.BasePrice = rate * currentTrade.BasePrice;
                        convertedTrades.push(convertedTrade);
                        GM_setValue("IBconverted", convertedTrades);
                    }
                });
            };
            getit(trades[i]);
        }
    }
}

function ratesConverted(sender, result) {
    var trades = GM_getValue("IB", null);
    var convertedTrades = GM_getValue("IBconverted", null);
    if(trades && convertedTrades && convertedTrades.length == trades.length) {
        setMessage(convertedTrades.length + " trades converted and saved!");
    }
    else {
        setMessage(convertedTrades.length + "/" + trades.length + " trades converted...");
        setTimeout(ratesConverted, timeout);
    }
}

function load() {
    setMessage("Loading trades...");
    var trades = [];
    var ibTradesElement = $("div[id^='tblTransactions']");
    var summaries = ibTradesElement.find(".summaryRow");
    summaries.each(function(key, value) {
        var currentTradeElements = $(value).find("td");
        //alert("1 - " + $(currentTradeElements[1]).html()+ "2 - " + $(currentTradeElements[2]).html()+"3 - " + $(currentTradeElements[3]).html()+"4 - " + $(currentTradeElements[4]).html()+"5 - " + $(currentTradeElements[5]).html()+"6 - " + $(currentTradeElements[6]).html()+"7 - " + $(currentTradeElements[7]).html());
        var currentTrade = {};
        currentTrade.Name = $(currentTradeElements[0]).html().split(">").pop();
        currentTrade.Date = $(currentTradeElements[1]).html();
        // Unknown issue with indexes. after 4 all indexes increased with 1
        currentTrade.Price = parseFloat($(currentTradeElements[6]).html().replace(',', ''));
        currentTrade.BasePrice = parseFloat($(currentTradeElements[8]).html().replace(',', ''));
        trades.push(currentTrade);
        //alert("loaded: " + currentTrade.Price + " " + currentTrade.BasePrice);
    });

    GM_setValue("IB", trades);

    setMessage(trades.length + " trades loaded! Converting...");

    convertTradeRates();
    setTimeout(ratesConverted, timeout);
}

setTimeout(initialize, timeout);