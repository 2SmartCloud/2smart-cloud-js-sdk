/* istanbul ignore file */
const entitiesScheme = [
    {
        rootTopic      : 'groups-of-properties',
        type           : 'GROUP_OF_PROPERTIES',
        autoInitialize : true,
        attributes     : {
            name : {
                validation  : [ 'required', 'string' ],
                settable    : false,
                retained    : true,
                description : 'Group name'
            },
            value : {
                settable    : true,
                retained    : true,
                description : ''
            }
        }
    },
    {
        rootTopic      : 'bridges',
        type           : 'BRIDGE',
        autoInitialize : true,
        attributes     : {
            configuration : {
                validation  : [ 'required', 'any_object' ],
                settable    : true,
                retained    : true,
                description : 'Configuration of a bridge',
                dataType    : 'json'
            },
            status : {
                validation  : [ 'string', { 'one_of': [ 'started', 'stopped' ] } ],
                settable    : false,
                retained    : false,
                description : 'Can be started, stopped, starting, stopping'
            },
            state : {
                validation  : [ 'required', 'string', { 'one_of': [ 'started', 'stopped', 'starting', 'stopping' ] } ],
                settable    : false,
                retained    : true,
                description : 'Can be started, stopped, starting, stopping'
            },
            type : {
                validation  : [ 'required', 'string' ],
                settable    : false,
                retained    : true,
                description : 'Type of the bridge'
            },
            event : {
                validation  : [ 'string', { 'one_of': [ 'start', 'stop' ] } ],
                settable    : true,
                retained    : false,
                description : 'start/stop'
            }
        }
    },
    {
        rootTopic      : 'bridge-types',
        type           : 'BRIDGE_TYPES',
        autoInitialize : false,
        attributes     : {
            title : {
                validation  : [ 'required', 'string' ],
                settable    : false,
                retained    : false,
                description : 'Bridge title'
            },
            configuration : {
                validation  : [ 'required', 'any_object' ],
                settable    : false,
                retained    : false,
                description : 'Configuration of a bridge form',
                dataType    : 'json'
            },
            icon : {
                validation  : [ 'string' ],
                settable    : false,
                retained    : false,
                description : 'Bridge icon'
            },
            status : {
                validation  : [ 'required', 'string', { 'one_of': [ 'removed', 'pulled' ] } ],
                settable    : false,
                retained    : false,
                description : 'Can be started, stopped, starting, stopping'
            },
            state : {
                validation  : [ 'required', 'string', { 'one_of': [ 'removing', 'removed', 'pulling', 'pulled' ] } ],
                settable    : false,
                retained    : false,
                description : 'Can be started, stopped, starting, stopping'
            },
            event : {
                validation  : [ 'string', { 'one_of': [ 'remove', 'pull', 'check' ] } ],
                settable    : true,
                retained    : false,
                description : 'remove/pull/check'
            },
            version : {
                validation  : [ 'any_object' ],
                settable    : false,
                retained    : false,
                description : 'Bridge versioning object',
                dataType    : 'json'
            }
        }
    },
    {
        rootTopic      : 'notification-channels',
        type           : 'NOTIFICATION_CHANNELS',
        autoInitialize : true,
        attributes     : {
            alias : {
                validation  : [ 'required', 'string', 'not_empty' ],
                settable    : true,
                retained    : true,
                description : 'Notification channel name'
            },
            configuration : {
                validation  : [ 'required', 'any_object' ],
                settable    : true,
                retained    : true,
                description : 'Configuration of a notification channel form',
                dataType    : 'json'
            },
            state : {
                validation  : [ 'required', 'string', { 'one_of': [ 'enabled', 'disabled' ] } ],
                settable    : true,
                retained    : true,
                description : 'Can be enabled or disabled'
            },
            event : {
                validation  : [ 'string', { 'one_of': [ 'send' ] } ],
                settable    : true,
                retained    : false,
                description : 'Send event'
            },
            type : {
                validation  : [ 'required', 'string', 'not_empty' ],
                settable    : false,
                retained    : true,
                description : 'Channel type'
            }
        }
    },
    {
        rootTopic      : 'system-updates',
        type           : 'SYSTEM_UPDATES',
        autoInitialize : true,
        attributes     : {
            status : {
                validation : [
                    'required',
                    'string',
                    {
                        'one_of' : [
                            'up-to-date',         // no available updates
                            'download-available', // updates available to download
                            'downloading',        // downloading updates
                            'update-available',   // services are downloaded and ready to update
                            'updating',           // updating services
                            'restarting'          // restarting services
                        ]
                    }
                ],
                settable    : false,
                retained    : true,
                description : 'Status of the system'
            },
            event : {
                validation : [
                    'string',
                    {
                        'one_of' : [
                            'check',    // check for available updates or downloads
                            'download', // download available updates
                            'update',   // update services with new ones
                            'restart'   // restart system
                        ]
                    }
                ],
                settable    : true,
                retained    : false,
                description : 'Event to check for updates or start update process'
            },
            'last-update' : {
                validation  : [ 'required', 'positive_decimal' ],
                settable    : false,
                retained    : true,
                description : 'Timestamp of last update'
            },
            'available-update' : {
                validation  : [ 'positive_decimal' ],
                settable    : false,
                retained    : true,
                description : 'Timestamp of available update'
            }
        }
    },
    {
        rootTopic      : 'topics-aliases',
        type           : 'TOPICS_ALIASES',
        autoInitialize : true,
        attributes     : {
            name : {
                validation  : [ 'required', { like: '^[0-9a-z. ]{1,100}$' } ],
                settable    : true,
                retained    : true,
                description : 'Topic\'s alias'
            },
            topic : {
                validation  : [ 'required', { like: '^(([a-z0-9-]+/)+)((\\$?[a-z0-9-]+)*)((/[a-z0-9-]+)*)$' } ],
                settable    : false,
                retained    : true,
                description : 'Topic for alias'
            }
        },
        methods : {
            serialize() {
                const serialized = { id: this.id, entityTopic: this.entityTopic };

                for (const attribute in this._attributes) {
                    serialized[attribute] = this[attribute];
                }

                let parsedTopic = {};

                try {
                    const { translated: { options } } = this.homie.translator.parseTopic(this.topic);

                    parsedTopic = options;
                } catch (err) {
                    this.debug.warning(`Entity.serialize error with parsing entity topic: ${err}`);
                }

                return {
                    ...serialized,
                    parsedTopic
                };
            }
        }
    },
    {
        rootTopic      : 'extensions',
        type           : 'EXTENSION',
        autoInitialize : true,
        attributes     : {
            name : {
                validation  : [ 'required', 'string' ],
                settable    : false,
                retained    : true,
                description : 'Extension name'
            },
            version : {
                validation  : [ 'required', 'string' ],
                settable    : false,
                retained    : true,
                description : 'Extension version'
            },
            description : {
                validation  : [ 'required', 'string' ],
                settable    : false,
                retained    : true,
                description : 'Extension description'
            },
            link : {
                validation  : [ 'required', 'url' ],
                settable    : false,
                retained    : true,
                description : 'Extension page URL'
            },
            iconFilename : {
                validation  : [ 'string' ],
                settable    : false,
                retained    : true,
                description : 'Icon filename'
            },
            event : {
                validation : [
                    'string',
                    {
                        'one_of' : [
                            'install',
                            'uninstall',
                            'update',
                            'check'
                        ]
                    }
                ],
                settable    : true,
                retained    : false,
                description : 'Extension actions'
            },
            state : {
                validation : [
                    'required',
                    'string',
                    {
                        'one_of' : [
                            'installing',
                            'installed',
                            'updating',
                            'update-available',
                            'uninstalling',
                            'uninstalled',
                            'up-to-date'
                        ]
                    }
                ],
                settable    : false,
                retained    : true,
                description : 'Extension current state'
            },
            type : {
                validation  : [ 'required', 'string', { 'one_of': [ 'simple-scenario' ] } ],
                settable    : false,
                retained    : true,
                description : 'Extension available types'
            },
            scheme : {
                validation  : [ { 'list_of': 'any_object' } ],
                settable    : true,
                retained    : true,
                description : 'Extension scheme to render the creation form on UI',
                dataType    : 'json'
            },
            language : {
                validation  : [ 'required', { 'one_of': [ 'JS' ] } ],
                settable    : false,
                retained    : true,
                description : 'Programming language on which written current extension'
            }
        }
    },
    {
        rootTopic      : 'notifications',
        type           : 'NOTIFICATION',
        autoInitialize : true,
        attributes     : {
            type : {
                validation : [ 'required', 'string', { 'one_of': [ 'text' ] } ],
                settable   : false,
                retained   : true
            },
            logLevel : {
                validation : [ 'required', 'string', { 'one_of': [ 'info', 'warning', 'error' ] } ],
                settable   : false,
                retained   : true
            },
            senderName : {
                validation : [ 'required', 'string' ],
                settable   : false,
                retained   : true
            },
            message : {
                validation : [ 'required', 'string' ],
                settable   : false,
                retained   : true
            },
            isRead : {
                validation : [ 'required', 'boolean' ],
                settable   : true,
                retained   : true
            },
            createdAt : {
                validation : [ 'required', 'positive_integer' ],
                settable   : false,
                retained   : true
            }
        }
    },
    {
        rootTopic      : 'discovery',
        type           : 'DISCOVERY',
        autoInitialize : true,
        attributes     : {
            name : {
                validation  : [ 'required', 'string' ],
                settable    : false,
                retained    : true,
                description : 'Discovery device name'
            },
            acceptedAt : {
                validation  : [ 'positive_integer' ],
                settable    : true,
                retained    : true,
                description : 'Discovery device acceptance time'
            },
            event : {
                validation  : [ { 'one_of': [ 'accept' ] } ],
                settable    : true,
                retained    : false,
                description : 'Discovery device events'
            }
        },
        methods : {
            /*
             * publish discovery accepted device token to the "discovery/accepted/<device-id>" topic
             */
            publishToken(token) {
                const tokenTopic = `discovery/accepted/${this.id}`;

                this._homie.publishToBroker(tokenTopic, token, { retain: true });
            },

            clearRelatedTopics() {
                const announcedTopic = `discovery/new/${this.id}`;
                const tokenTopic = `discovery/accepted/${this.id}`;

                this._homie.publishToBroker(announcedTopic, '', { retain: true });
                this._homie.publishToBroker(tokenTopic, '', { retain: true });
            }
        }
    }
];

module.exports = entitiesScheme;
