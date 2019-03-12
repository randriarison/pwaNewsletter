if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        var js = document.getElementById('js');
        if (js && js.dataset.sw) {
            // Register Service Worker with URL stored in data-sw
            navigator.serviceWorker.register(js.dataset.sw)
                .then(function(registration) {
                    // Registration was successful
                    console.log("SW scope:", registration.scope);
                    var nbCached = document.getElementById('nbCached'),
                        emailForm = document.getElementById('emailForm'),
                        form_email = document.getElementById('form_email'),
                        logCont = document.getElementById('log'),
                        cacheChecking = false,
                        nbLoading = 0,
                        addLoading = function() {
                            if (nbLoading == 0) {
                                nbCached.classList.add('loading');
                            }
                            nbLoading++;
                        },
                        removeLoading = function() {
                            nbLoading--;
                            if (nbLoading == 0) {
                                nbCached.classList.remove('loading');
                            }
                        },
                        setCacheNb = function(nb) {
                            if (nb) {
                                // We have some cached data in server
                                nbCached.innerHTML = nb;
                            } else {
                                nbCached.innerHTML = '';
                            }
                        },
                        checkCache = function(requestSend) {
                            // Check cache by calling a JSON request handled by the SW
                            if (cacheChecking) {
                                return;
                            }
                            cacheChecking = true;
                            addLoading();
                            console.log(js.dataset.cacheurl);
                            fetch(js.dataset.cacheurl+(requestSend ? '?requestSend' : ''))
                                .then(function(response) {
                                    cacheChecking = false;
                                    return response.json();
                                })
                                .then(function(data) {
                                    removeLoading();
                                    setCacheNb(data.nb);
                                });
                        },
                        registerAppInstall = function() {
                            // from https://developers.google.com/web/fundamentals/engage-and-retain/app-install-banners/
                            var deferredPrompt,
                                btnAppInstall;

                            window.addEventListener('beforeinstallprompt', function(e) {
                                console.log('beforeinstallprompt Event fired');
                                e.preventDefault();

                                // Stash the event so it can be triggered later.
                                deferredPrompt = e;

                                if (!btnAppInstall) {

                                    btnAppInstall = document.createElement('a');
                                    btnAppInstall.setAttribute('href', '#');
                                    btnAppInstall.setAttribute('id', 'btnAppInstall');
                                    btnAppInstall.innerHTML = 'Add to homescreen';

                                    document.querySelector('body').appendChild(btnAppInstall);

                                    btnAppInstall.addEventListener('click', function(e) {
                                        e.preventDefault();

                                        deferredPrompt.prompt();

                                        // Follow what the user has done with the prompt.
                                        deferredPrompt.userChoice.then(function(choiceResult) {
                                            console.log(choiceResult.outcome);

                                            if (choiceResult.outcome == 'dismissed') {
                                                console.log('User cancelled home screen install');
                                            } else {
                                                console.log('User added to home screen');
                                            }

                                            // We no longer need the prompt.  Clear it up.
                                            deferredPrompt = null;
                                            document.querySelector('body').removeChild(btnAppInstall);
                                            btnAppInstall = false;
                                        });
                                    });
                                }

                                return false;
                            });
                        };

                    nbCached.addEventListener('click', function(event) {
                        event.preventDefault();
                        checkCache(true);
                    });

                    // When we go back online, check the cache.
                    // This could be used to do it faster than background sync in some cases.
                    /*
                    window.addEventListener('online',  function(event) {
                        console.log('Just went online, checkCache and request sending');
                        checkCache(true);
                    });
                    // */

                    // SW can force cache checking after sending element
                    navigator.serviceWorker.addEventListener('message', function(event) {
                        if (event.data.tag) {
                            switch(event.data.tag) {
                                case 'cacheNb':
                                    console.log('Cache nb sent by SW');
                                    setCacheNb(event.data.nb);
                                    break;
                                case 'addLoading':
                                    console.log('addLoading by SW');
                                    addLoading();
                                    break;
                                case 'removeLoading':
                                    console.log('removeLoading by SW');
                                    removeLoading();
                                    break;
                                case 'alert':
                                    logCont.innerHTML = event.data.alert+'<br />'+logCont.innerHTML;
                                    break;
                            }
                        }
                    });

                    // Handle form to be an AJAX request
                    emailForm.addEventListener('submit',  function(event) {
                        event.preventDefault();
                        addLoading();
                        let formData = new FormData(emailForm);
                        let jsonObject = {};
                        for (const [key, value]  of formData.entries()) {
                            jsonObject[key] = value;
                        }
                        fetch(emailForm.getAttribute('action'), {
                            method: emailForm.getAttribute('method'),
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                            },

                            body: JSON.stringify(jsonObject)
                            // body:  formData
                            // headers: {
                            //     "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                            // },
                            //body: 'email=ipsum'

                        }).then(function(response) {
                            return response.json();
                        }).then(function() {
                            removeLoading();
                            form_email.value = '';
                        }).catch(function(response){
                            console.log(response)
                        });
                    });

                    // Force check cache on load in case we have some cached elements
                    checkCache();

                    registerAppInstall();
                }).catch(function(err) {
                    // registration failed :(
                    console.log('ServiceWorker registration failed: ', err);
                });
        }
    });
}
