// ==UserScript==
// @name         Easy list picking
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://eu-west-1.console.aws.amazon.com/sqs/home?region=eu-west-1
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Standard environment, appear as is in the list of environment
    var standardEnvironments = ['PRODUCTION', 'DEMO', 'LOADTEST'];

    // User with environment, each has a list named like *_LOCAL_{NAME}
    var usersWithLocalEnvironment = ['TIM', 'GABRIEL', 'ED', 'JOE', 'MATT', 'SOWMYA', 'FRANCESCO', 'ALEX', 'MIKE', 'VIET', 'TOM'];

    // Multiplied environment: each has 3 copies with suffix 1, 2 and 3
    var multipliedEnvironements = ['UAT', 'AUTOTEST', 'STAGING','DEV', 'QA'];

    // Type of queues
    var queueTypes = ['TAGS', 'FACTS','EVENTS', 'EMAILS', 'BACKGROUND_HIGH_PRIORITY', 'BACKGROUND_LOW_PRIORITY', 'HISTORICAL_CUSTOMERS', 'REGISTRATION'];

    var log = function log(msg, lvl = 10) {
        // The current log level: the lower the more it displays
        var crtLvl = 0;
        if (crtLvl < lvl && lvl < 10) console.debug(msg);
        if (lvl == 10) console.info(msg);
    }

    var doTheStuff = function() {
        log('Doing the stuff', 1);

        var getQueueTypes = function() {
            log('function getQueueTypes', 1);
            var types = queueTypes;
            return types;
        }

        var getQueueEnvs = function() {
            log('function getQueueEnvs', 1);
            var envs = standardEnvironments.slice(0);
            var baseEnvs = multipliedEnvironements;
            log('Adding 4x' + baseEnvs.length + ' envs to the list', 1);
            baseEnvs.forEach(function(v){['', '2', '3', '4'].forEach(function(el){envs.push(v+el);})})
            var users = usersWithLocalEnvironment;
            log('Adding ' + users.length + ' envs to the list', 1);
            users.forEach(function(el){envs.push('LOCAL_'+el)});
            return envs;
        }

        // Find out in which list does the word belong, and return other entries from that list
        var getOtherWords = function(word) {
            log('function getOtherWords', 1);
            var types = getQueueTypes();
            var envs = getQueueEnvs();
            var otherWords = [];

            if (types.includes(word)) {
                types.forEach(function(e){if (e!=word){otherWords.push(e);}});
            }
            if (envs.includes(word)) {
                envs.forEach(function(e){if (e!=word){otherWords.push(e);}});
            }
            return otherWords;
        };

        // When clicking on a div.otherOption, replace within the value of input.gwt-TextBox the string in the attribute data-rpl with the clicked word
        var addSelectCopyEvent = function() {
            log('function addSelectCopyEvent', 1);
            // Event to replace text on click
            document.addEventListener('click', function(event){
                if (event.target.getAttribute('class') == 'otherOption') {
                    var mm = document.getElementsByClassName('gwt-TextBox')[0];
                    mm.value = mm.value.replace(event.target.getAttribute('data-rpl'), event.target.innerHTML);
                    log('replacing ' + event.target.getAttribute('data-rpl') + ' with ' + event.target.innerHTML, 1);

                    var textbox = document.getElementsByClassName('gwt-TextBox')[0];
                    // dispatch customer event
                    var evtk = document.createEvent("HTMLEvents");
                    evtk.initEvent("keyup", false, true);
                    textbox.dispatchEvent(evtk);
                    log('firing keyup event', 1);
                }
            });

            // General mouseup event for creating popup or hiding popup or copying selected text
            document.addEventListener('mouseup', function(event) {
                // get useful elements
                var popup = document.getElementById('popup');
                var selection = window.getSelection();
                var textbox = document.getElementsByClassName('gwt-TextBox')[0];

                // clicks within the input box have a special meaning
                if (event.target.getAttribute('class') == 'gwt-TextBox') {
                    if (selection.isCollapsed) {
                        var word = readWord(selection);
                        var otherWords = getOtherWords(word);
                        var posx = event.clientX +window.pageXOffset +'px'; //Left Position of Mouse Pointer
                        var posy = event.clientY + window.pageYOffset + 'px';

                        if (!popup) {
                            // create a popup menu element
                            popup = document.createElement('div');
                            popup.setAttribute('id', 'popup');
                            popup.setAttribute('style', 'display:none;');
                            document.body.appendChild(popup);
                        }

                        if (!popup) {
                            log('no popup element found, ignoring');
                        } else {
                            popup.style.position = 'absolute';
                            popup.style.display = 'inline';
                            popup.style.left = posx;
                            popup.style.top = posy;
                            popup.style.backgroundColor = '#aaa';
                            popup.style.fontFamily = 'Courier';
                            popup.style.opacity = 0.9;
                            popup.style.cursor = 'pointer';
                            popup.style.border = "thin solid #111";
                            popup.innerHTML='<div class="otherOption" data-rpl="'+word+'">'+otherWords.join('</div><div class="otherOption" data-rpl="'+word+'">')+'</div>';
                        }
                    }

                 //   return;
                } else {
                    // if a popup is shown, hide it
                    if (popup) popup.setAttribute('style', 'display:none');
                }

                // if something is selected, and starts with MM, paste in the textbox
                if (selection.toString().length > 0) {
                    if (selection.toString().substring(0, 3) == 'MM_') {
                        // we like that selection, let's paste it in the search bar
                        textbox.value = selection;

                        // dispatch customer event
                        var evt = document.createEvent("HTMLEvents");
                        evt.initEvent('keyup', false, true);
                        textbox.dispatchEvent(evt);

                        textbox.focus();
                        log("queue name to search for: " + selection.toString(), 3);
                    } else {
                        log("something selected but no clue what to do with it... " + selection.toString(), 3);
                    }
                }
            });

            // event for hiding popup on keypress
            document.addEventListener('keydown', function(event){
                var p = document.getElementById('popup');
                if (p) p.style.display = 'none';
                log('hiding popup', 1);
            });
        }

        var getStringParts = function(str) {
            var parts = {prefix:'MM',type:'',env:'',dl:false};
            var types = getQueueTypes();
            // var envs =  getQueueEnvs();

            if (str.substr(str.length - 11, 11) == '_DEADLETTER') {
                parts.dl = true;
                str = str.substring(0, str.length - 11);
            }

            var regex = new RegExp('MM_('+types.join('|')+')_(.*)');
            //re = /MM_(BACKGROUND_HIGH_PRIORITY|TAGS|HISTORICAL_CUSTOMER|FACTS)_((AUTOTEST|STAGING|PRODUCTION)[1-4]?)(_DEADLETTER)?/
            //re = /MM_(TAGS|FACTS)_(UAT2|AUTOTEST2)(_DEADLETTER)?/
            var res = regex.exec(str);

            if (res) {
                parts.type = res[1];
                parts.env = res[2];
                if (res[3]) parts.dl = true;
                log('String "'+str+'" has parts '+JSON.stringify(parts), 2);
            } else {
                log("Cannot read "+str, 1);
            }
        }

        var addDropdown = function() {
            var textbox = document.getElementsByClassName('gwt-TextBox')[0];
            var container = textbox.parentElement;
            var newDiv = document.createElement('div');
            newDiv.setAttribute("id", "newDiv");
            newDiv.setAttribute('style', 'display:inline;')
            var select = document.createElement('select');
            select.setAttribute('style', 'border:0');
            log(select, 1);
            newDiv.appendChild(select);
            ['TAGS', 'FACTS'].forEach(function(entry) {select.options[select.options.length] = new Option(entry, entry);});
            log(newDiv, 1);
            container.appendChild(newDiv);
            log(textbox, 1);

            // re = /MM_(BACKGROUND_HIGH_PRIORITY|TAGS|HISTORICAL_CUSTOMER|FACTS)_((AUTOTEST|STAGING|PRODUCTION)[1-4]?)(_DEADLETTER)?/
            var re2 = /MM_(TAGS|FACTS)_(UAT2|AUTOTEST2)(_DEADLETTER)?/
            var res = re2.exec('MM_TAGS_UAT2');
            log(res, 1);
        }

        var watchBox = function () {
            var textbox = document.getElementsByClassName('gwt-TextBox')[0];
            textbox.addEventListener('change', function(event) {
                var str = event.target.value;
                getStringParts(str);
            });
        }

        var getAllWords = function() {
            var ar = ['DEADLETTER', 'MM'];
            ar = ar.concat(getQueueEnvs());
            ar = ar.concat(getQueueTypes());
            return ar;
        }
        var recogniseWord = function(word) {
            // var words = ['TAGS','UAT2'];
            var words = getAllWords();

            if (words.includes(word)) {
                log('recognising '+word, 2);
                return true;
            } else {
                log('NOT recognising '+word, 2);
                return false;
            }
        }

        var reachedBeginingOfSentence = function(selection) {
            var ret = false;
            selection.modify('extend', 'backward', 'character');

            if (selection.toString() == '') {
                // we cannot extend left
                ret = true;
            } else {
                // we can still go left, say nay
                selection.modify('extend', 'forward', 'character');
            }

            return ret;
        }

        var reachedEndOfSentence = function(selection) {
            var s1 = selection.toString();
            selection.modify('extend', 'forward', 'character');
            if (selection.toString() == s1) {
                // we are still the same: we have reached the end
                return true;
            } else {
                // not the same, step back and say no
                selection.modify('extend', 'backward', 'character');
                return false;
            }
        }

        var reachedBeginingOfWord = function(selection) {
            if (reachedBeginingOfSentence(selection)) {
                return true;
            }

            var res = false;
            selection.modify('extend', 'backward', 'character');
            if (selection.toString() == '_') {
                res = true;
            }
            selection.modify('extend', 'forward', 'character');
            return res;
        }

        var reachedEndOfWord = function(selection) {
            if (reachedEndOfSentence(selection)) {
                return true;
            }

            var res = false;
            selection.modify('extend', 'forward', 'character');
            if (selection.toString().substr(-1) == '_') {
                res = true;
            }
            selection.modify('extend', 'backward', 'character');
            return res;
        }

        var readTowardRight = function(selection) {
            log('reading ', 1);
            var limit = 100;
            var counter = 0;
            var wordBefore;
            selection.modify('extend', 'forward', 'character');
            log('towards right, starting with '+selection.toString(), 1);
            while (true) {
                counter++;
                if (counter >= limit) break;

                selection.modify('extend', 'forward', 'character');

                if (reachedEndOfWord(selection)) {
                    // either next is _ or end of string
                    if (recogniseWord(selection.toString())) {
                        return selection.toString();
                    }

                    if (reachedEndOfSentence(selection)) {
                        log('Stop', 1);
                        // end of sentence and found nothing
                        return;
                    }
                }
            }
        }

        var readWord = function(selection) {
            var limit = 100;
            var counter = 0;
            var candidate;
            var result;

            while (true) {
                counter++;
                if (counter >= limit) break;
                if (reachedBeginingOfWord(selection)) {
                    // either _ before or begining of sentence
                    result = readTowardRight(selection);
                    if (result) {
                        log('yay', 1);
                        break;
                    }
                    // no result, is there still place?

                    if (reachedBeginingOfSentence(selection)) {
                        // no space left, done
                        break;
                    }

                    // now go left twice
                    selection.modify('move', 'backward', 'character');
                }
                selection.modify('move', 'backward', 'character');
            }

            // if (result) alert('You clicked on ' + result);
            return result;
        }

        var clickOnBox = function() {
            var textbox = document.getElementsByClassName('gwt-TextBox')[0];
            textbox.addEventListener('mouseup', function(event) {
                var s = window.getSelection();
                if (s.isCollapsed) {
                    var word = readWord(s);
                    var posx = event.clientX +window.pageXOffset +'px'; //Left Position of Mouse Pointer
                    var posy = event.clientY + window.pageYOffset + 'px';

                    var popup = document.getElementById('popup');
                    if (!popup) {
                        // create a popup menu element
                        popup = document.createElement('div');
                        popup.setAttribute('id', 'popup');
                        popup.setAttribute('style', 'display:none;');
                        document.body.appendChild(popup);
                    }

                    if (!popup) {
                        log('no popup element found, ignoring');
                    } else {
                        popup.style.position = 'absolute';
                        popup.style.display = 'inline';
                        popup.style.left = posx;
                        popup.style.top = posy;
                        popup.innerHTML='!='+word
                        log(event.clientX, 1);
                    }
                }
            });
        }

        // Call the function to add the eventListeners
        addSelectCopyEvent();
    }

    log('function doTheStuff() is defined', 1);

    (function init() {
        log('Initialising (means check text box is ready, and wait if not', 1);
        var textbox = document.getElementsByClassName('gwt-TextBox')[0];
        if (textbox) {
            log(textbox, 1);
            doTheStuff();
        } else {
            log('waiting 0.1s', 1);
            setTimeout(init, 100);
        }
    })();

})();
