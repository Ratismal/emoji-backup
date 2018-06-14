const { Plugin } = require('elements');

const Settings = require('./settings');
let cache;
try {
    cache = require('./cache.json');
} catch (err) {
    cache = [];
}
const fs = require('fs');
const path = require('path');

module.exports = class commands extends Plugin {
    /**
     * Contains all the loading logic, that does not depend on the DOM or other plugins
     */
    preload() {
        this.registerSettingsTab('Emoji Backup', Settings(this));
    }
    /**
     * Contains all the loading logic, that does depend on the DOM or other plugins
     */
    load() {
        console.log(require('elements'));

        this.log('Emoji-Backup has been loaded!');
        this.interval();
        setInterval(1000 * 60 * 30, this.interval.bind(this)); // every half hour
    }
    /**
     * Stuff to do on unload (e.g. freeing resources, timers and event handlers)
     */
    unload() { }

    get latest() {
        return cache[cache.length - 1];
    }

    get cache() {
        return cache;
    }

    serializeHistory(history) {
        history = Object.keys(history).map(k => {
            let o = history[k];
            o.name = k;
            return o;
        });
        history.sort((a, b) => {
            return b.score - a.score;
        });
        let serialized = history.map(h => h.name).join('|');

        return serialized;
    }

    async interval() {
        if (cache.length === 0) {
            cache.push({
                date: Date.now(),
                history: JSON.parse(this.DI.localStorage.EmojiUsageHistory)
            });
            return await this.saveCache();
        }

        let s1 = this.serializeHistory(this.latest.history);
        let current = JSON.parse(this.DI.localStorage.EmojiUsageHistory);
        let s2 = this.serializeHistory(current);

        console.log(s1, s2);

        if (s1 !== s2) {
            cache.push({ date: Date.now(), history: current });
            await this.saveCache();
        }
    }

    saveCache() {
        return new Promise((res, rej) => {
            fs.writeFile(path.join(__dirname, 'cache.json'), JSON.stringify(cache), err => {
                if (err) rej(err);
                else res();
            });
        });
    }
};