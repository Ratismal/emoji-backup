const { Plugin } = require('elements');

const Settings = require('./settings');
let cache;

const fs = require('fs');
const path = require('path');

module.exports = class commands extends Plugin {
    /**
     * Contains all the loading logic, that does not depend on the DOM or other plugins
     */
    preload() {
        this.registerSettingsTab('Emoji Backup', Settings(this));

        try {
            cache = JSON.parse(
                fs.readFileSync(this.getSettingsNode('cachePath',
                    path.join(__dirname, '..', 'di-emoji-backup-cache.json')),
                    { encoding: 'utf8' })
            );
        } catch (err) {
            cache = [];
        }
    }
    /**
     * Contains all the loading logic, that does depend on the DOM or other plugins
     */
    load() {
        this.log('Emoji-Backup has been loaded!');
        this.interval();
        this._interval = setInterval(this.interval.bind(this), 1000 * 60 * 30); // every half hour
    }
    /**
     * Stuff to do on unload (e.g. freeing resources, timers and event handlers)
     */
    unload() {
        clearInterval(this._interval);
    }

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
        let current = JSON.parse(this.DI.localStorage.EmojiStore);
        let s2 = this.serializeHistory(current._state.usageHistory);

        if (s1 !== s2) {
            cache.push({ date: Date.now(), history: current });
            if (cache.length > 30) cache.shift();
            await this.saveCache();
        }
    }

    reloadCache() {
        return new Promise((res, rej) => {
            fs.exists(this.getSettingsNode('cachePath'), exists => {
                if (exists) {
                    fs.readFile(this.getSettingsNode('cachePath'), { encoding: 'utf8' }, (err, data) => {
                        try {
                            cache = JSON.parse(data);
                        } catch (err) {
                            res(this.saveCache());
                        }
                    });
                } else res(this.saveCache());
            });
        });
    }

    saveCache() {
        this.log('Saving cache...');
        return new Promise((res, rej) => {
            fs.writeFile(this.getSettingsNode('cachePath'), JSON.stringify(cache), err => {
                if (err) rej(err);
                else res();
            });
        });
    }
};