/**
 * 网页大厅 iframe 可能在 Cocos 引擎启动前就发出 openGame / changeType。
 * 仅 isWebHall=1 时提前监听并缓存，进 WebHallOb 后由 window.__webHallEarly.take() 取走并拆掉监听。
 */
(function () {
    try {
        var params = new URLSearchParams(window.location.search);
        if (params.get("isWebHall") !== "1") return;
    } catch (e) {
        return;
    }

    var SEND_TYPES = { gameBack: 1, errText: 1, gameLoaded: 1 };
    var RECV_TYPES = { openGame: 1, changeType: 1 };
    var cache = { openGame: null, changeType: null };
    var listening = true;

    function parseData(data) {
        if (!data) return null;
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error("webHallEarly JSON.parse error", e, data);
                return null;
            }
        }
        if (!data || typeof data !== "object") return null;
        return data;
    }

    function onMessage(event) {
        if (!listening) return;
        var data = parseData(event && event.data);
        if (!data || !data.type) return;
        if (SEND_TYPES[data.type]) return;
        if (!RECV_TYPES[data.type]) return;
        if (data.type === "openGame") cache.openGame = data;
        if (data.type === "changeType") cache.changeType = data;
        console.log("webHallEarly 缓存 message", data.type, data);
    }

    function peek() {
        return {
            openGame: cache.openGame,
            changeType: cache.changeType,
        };
    }

    function take() {
        if (!listening) return null;
        listening = false;
        window.removeEventListener("message", onMessage);
        var taken = {
            openGame: cache.openGame,
            changeType: cache.changeType,
        };
        cache.openGame = cache.changeType = null;
        console.log("webHallEarly 交出缓存", taken);
        return taken;
    }

    window.__webHallEarly = { take: take, peek: peek };
    window.addEventListener("message", onMessage);
    console.log("webHallEarly 已开始监听 postMessage");
})();
