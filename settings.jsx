const React = require('react');
const { SettingsTitle, SettingsDescription, SettingsOptionDescription,
    SettingsList, SettingsOptionButton, SettingsOptionTitle,
    SettingsOptionTextbox } = require('elements');
const moment = require('moment');
const remote = require('electron').remote;
const path = require('path');
const pack = require('./package.json');

let plugin;
module.exports = function (p) {
    plugin = p;
    return class Settings extends React.PureComponent {
        render() {
            let c = p.cache.map(c => c);
            c.reverse();
            c = c.slice(0, 15);
            function itemRenderer(id) {
                let ph = c[id].history._state.usageHistory;
                let history = Object.keys(ph).map(k => {
                    let o = ph[k];
                    o.name = k;
                    return o;
                });
                history.sort((a, b) => {
                    return b.score - a.score;
                });

                let sample = history.slice(0, 5).map(s => {
                    let n = s.name;
                    if (/\d{17,23}/.test(n)) { // custom emote
                        return (
                            <div className='emote' key={n}>
                                <img src={'https://cdn.discordapp.com/emojis/' + s.name + '.png?v=1'} />
                            </div>
                        );
                    } else {
                        return (<div className='emote' key={n}>:{n}:</div>);
                    }
                });
                function onClick() {
                    if (confirm('Restoring your emoji history will require a discord restart. Is this OK?')) {
                        let store = JSON.parse(p.DI.localStorage.getItem('EmojiStore'));
                        store._state.usageHistory = ph;
                        p.DI.localStorage.setItem('EmojiStore', JSON.stringify(store));
                        let win = remote.getCurrentWindow();
                        win.reload();
                    }
                }
                return (
                    <div className='emoji-history-item'>
                        <div className='time sect'>{moment(c[id].date).format('LLLL')}</div>
                        <div className='count sect'>Emote Count: {history.length}</div>
                        <div className='sample sect'>Sample:<br />
                            <div className='emote-container'>{sample}</div>
                        </div>
                        <SettingsOptionButton className='restore-button' outline={true} onClick={onClick} text='Restore' />
                    </div>
                );
            }

            function onPathApply() {
                p.log('reloading and saving new cache file');
                p.reloadCache();
            }

            return (
                <div>
                    <SettingsDescription text={"A utility to backup and restore emoji usage history. Version: " + pack.version} />

                    <SettingsOptionTitle text="Stored Cache" />
                    <SettingsOptionTextbox title='Cache Location' description='Where to store your history cache.'
                        apply lsNode='cachePath' plugin={p} onApply={onPathApply} />
                    <SettingsList length={c.length} itemRenderer={itemRenderer} />

                    <SettingsOptionTitle text="Online Sync" />
                    <SettingsOptionDescription text="coming soon maybe idk probably not" />

                </div>
            );
        }
    };
};