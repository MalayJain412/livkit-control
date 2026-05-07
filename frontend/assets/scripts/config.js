window.APP_CONFIG = window.APP_CONFIG || {};

(function () {
    var config = window.APP_CONFIG;

    function normalizeBaseUrl(value, fallback) {
        if (typeof value !== "string") {
            return fallback;
        }

        var trimmed = value.trim().replace(/^['"]|['"]$/g, "");
        if (!trimmed) {
            return fallback;
        }

        return trimmed.replace(/\/+$/, "");
    }

    function resolveUrl(baseUrl, path) {
        var normalizedBaseUrl = String(baseUrl || window.location.origin).replace(/\/$/, "");
        if (!path) {
            return normalizedBaseUrl;
        }

        if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path)) {
            return path;
        }

        try {
            return new URL(path, `${normalizedBaseUrl}/`).toString();
        } catch (error) {
            return `${normalizedBaseUrl}/${String(path).replace(/^\//, "")}`;
        }
    }

    config.FRONTEND_URL = normalizeBaseUrl(config.FRONTEND_URL, window.location.origin);
    config.BACKEND_URL = normalizeBaseUrl(config.BACKEND_URL, window.location.origin);

    config.frontendUrl = function (path) {
        return resolveUrl(config.FRONTEND_URL, path || "/");
    };

    config.backendUrl = function (path) {
        return resolveUrl(config.BACKEND_URL, path || "/");
    };

    config.ready = Promise.resolve();
})();