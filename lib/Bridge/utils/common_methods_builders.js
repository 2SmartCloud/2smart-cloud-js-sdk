/* eslint-disable func-names*/
/* eslint-disable camelcase*/
module.exports = {
    build_addDeviceProperty(homieMethod, arname, type) {
        const Property = require(`${__dirname}/../../Property`);
        const BasePropertyBridge = require(`${__dirname}/../Property`);

        return function (property) {
            if (property instanceof Property) {
                if (!property._isValid) return;
                property = new BasePropertyBridge(property, {
                    type,
                    debug               : this.debug,
                    republishingEnabled : this.republishingEnabled
                });
            }
            if (!(property instanceof BasePropertyBridge)) throw new Error('WAUD: !(property instanceof BaseProperty))');
            if (this[arname].find((p) => property.id === p.id)) throw new Error(`Property(${type}) with id ${property.id} is already added.`);
            this[arname].push(property);
            property.on('error', this.handleErrorPropagate);
            property.setDevice(this);
            this.addPropertyTransport(property.transport);

            if (!this.homieEntity[arname].includes(property.homieEntity)) {
                this.homieEntity[homieMethod](property.homieEntity);
            }

            if (this.bridge) property.attachBridge(this.bridge);
        };
    },
    build_removeDeviceProperty(homieMethod, arname, type) {
        return function (id) {
            const index = this[arname].findIndex((p) => id === p.id);

            if (index === -1) throw new Error(`Cannot find ${type} with id=${id}.`);
            const property = this[arname][index];

            if (property.bridge) property.detachBridge();

            this.homieEntity[homieMethod](id);

            property.unsetDevice();
            property.off('error', this.handleErrorPropagate);
            this[arname].splice(index, 1);
        };
    },
    build_addNode() {
        const HomieNode = require(`${__dirname}/../../Node`);
        const BaseNodeBridge = require(`${__dirname}/../Node`);

        return function (node) {
            if (node instanceof HomieNode) {
                if (!node._isValid) return;
                node = new BaseNodeBridge(node, { debug: this.debug, republishingEnabled: this.republishingEnabled });
            }
            if (!(node instanceof BaseNodeBridge)) throw new Error('WAUD: !(node instanceof BaseNode))');
            if (this.nodes.find((n) => node.id === n.id)) throw new Error(`Node with id ${node.id} is already added.`);
            this.nodes.push(node);
            node.on('error', this.handleErrorPropagate);
            node.setDevice(this);

            if (!this.homieEntity.nodes.includes(node.homieEntity)) this.homieEntity.addNode(node.homieEntity);

            if (this.bridge) node.attachBridge(this.bridge);
        };
    },
    build_removeNode() {
        return function (id) {
            const index = this.nodes.findIndex((n) => id === n.id);

            if (index === -1) throw new Error(`Cannot find node with id=${id}.`);
            const node = this.nodes[index];

            if (node.bridge) node.detachBridge();

            this.homieEntity.removeNodeById(id);

            node.unsetDevice();
            node.off('error', this.handleErrorPropagate);
            this.nodes.splice(index, 1);
        };
    },
    build_addNodeProperty(homieMethod, arname, type) {
        const HomieProperty = require(`${__dirname}/../../Property`);
        const BasePropertyBridge = require(`${__dirname}/../Property`);

        return function (property) {
            if (property instanceof HomieProperty)  {
                if (!property._isValid) return;
                property = new BasePropertyBridge(property, {
                    type,
                    debug               : this.debug,
                    republishingEnabled : this.republishingEnabled
                });
            }
            if (!(property instanceof BasePropertyBridge)) throw new Error('WAUD: !(property instanceof BaseProperty))');
            if (this[arname].find((p) => property.id === p.id)) throw new Error(`Property(${type}) with id ${property.id} is already added.`);
            this[arname].push(property);
            property.on('error', this.handleErrorPropagate);
            property.setNode(this);
            if (this.device) property.setDevice(this.device);
            this.addPropertyTransport(property.transport);

            if (!this.homieEntity[arname].includes(property.homieEntity)) {
                this.homieEntity[homieMethod](property.homieEntity);
            }

            if (this.bridge) property.attachBridge(this.bridge);
        };
    },
    build_removeNodeProperty(homieMethod, arname, type) {
        return function (id) {
            const index = this[arname].findIndex((p) => id === p.id);

            if (index === -1) throw new Error(`Cannot find ${type} with id=${id}.`);
            const property = this[arname][index];

            if (property.bridge) property.detachBridge();

            this.homieEntity[homieMethod](id);

            if (property.device) property.unsetDevice();
            property.unsetNode();
            property.off('error', this.handleErrorPropagate);
            this[arname].splice(index, 1);
        };
    },
    build_handleNewDevicePropertyEvent(homieMethodGetPropertyById, bridgeMethodAddProperty, arname, type) {
        const BasePropertyBridge = require(`${__dirname}/../Property`);

        return async function ({ deviceId, optionId, telemetryId }) {
            const propertyId = optionId || telemetryId;
            const homieDevice = this.homie.getDeviceById(deviceId);
            const deviceBridge = this.deviceBridge;
            let propertyBridge = null;

            if (deviceId !== deviceBridge.id) return;
            // istanbul ignore next
            if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.handleNewDevicePropertyEvent', { deviceId, propertyId });

            propertyBridge = deviceBridge[arname].find((n) => n.id === propertyId);
            if (propertyBridge) return propertyBridge;

            const homieProperty = homieDevice[homieMethodGetPropertyById](propertyId);

            propertyBridge = new BasePropertyBridge(homieProperty, {
                type,
                debug               : this.debug,
                republishingEnabled : false
            });
            deviceBridge[bridgeMethodAddProperty](propertyBridge);

            return propertyBridge;
        };
    },
    build_handleNewNodeEvent() {
        const BaseNodeBridge = require(`${__dirname}/../Node`);

        return async function ({ deviceId, nodeId }) {
            const deviceBridge = this.deviceBridge;

            if (deviceId !== deviceBridge.id) return;
            // istanbul ignore next
            if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.handleNewNodeEvent', { deviceId, nodeId });
            const homieDevice = this.homie.getDeviceById(deviceId);
            const homieNode = homieDevice.getNodeById(nodeId);

            let nodeBridge = deviceBridge.nodes.find((n) => n.id === nodeId);

            if (nodeBridge) return nodeBridge;
            nodeBridge = new BaseNodeBridge(homieNode, { debug: this.debug, republishingEnabled: false });
            nodeBridge.publishAttribute('state', 'lost');
            deviceBridge.addNode(nodeBridge);

            return nodeBridge;
        };
    },
    build_handleNewNodePropertyEvent(homieMethodGetPropertyById, bridgeMethodAddProperty, arname, type) {
        const BasePropertyBridge = require(`${__dirname}/../Property`);

        return async function ({ deviceId, nodeId, optionId, telemetryId, sensorId }) {
            const propertyId = optionId || telemetryId || sensorId;
            const homieDevice = this.homie.getDeviceById(deviceId);
            const deviceBridge = this.deviceBridge;
            let propertyBridge = null;

            if (deviceId !== deviceBridge.id) return;
            // istanbul ignore next
            if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.handleNewNodePropertyEvent', { deviceId, nodeId, propertyId, telemetryId, sensorId });

            let nodeBridge = deviceBridge.nodes.find((n) => n.id === nodeId);

            if (!nodeBridge) nodeBridge = await this.handleNewNodeEvent({ deviceId, nodeId });
            propertyBridge = nodeBridge[arname].find((p) => p.id === propertyId);
            if (propertyBridge) return propertyBridge;

            const homieNode = homieDevice.getNodeById(nodeId);
            const homieProperty = homieNode[homieMethodGetPropertyById](propertyId);

            propertyBridge = new BasePropertyBridge(homieProperty, {
                type,
                debug               : this.debug,
                republishingEnabled : false
            });
            nodeBridge[bridgeMethodAddProperty](propertyBridge);

            return propertyBridge;
        };
    }
};
