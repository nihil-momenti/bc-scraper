define([
    'knockout',
    'lodash',
    './item'
], function (ko, _, Item) {
    function User(uri, cache, worker, canvas, simulation) {
        this.init(uri, cache, worker, canvas, simulation);
    }

    User.prototype = new Item();
    User.prototype.constructor = User;

    User.prototype.init = function (uri, cache, worker, canvas, simulation) {
        this.name = ko.observable();
        this.collectedIds = ko.observableArray();
        this.collected = this.collectedIds.map(_.bind(cache.createAlbum, cache, canvas, simulation));
        this.related = this.collected.map(_.identity);
        this.headerText = ko.computed(function () { return _.escape(this.name()); }, this);
        Item.prototype.init.call(this, uri, cache, worker, canvas, simulation);
    };

    User.prototype.onLoaded = function (data) {
        this.name(data.name);
        for (var i = 0; i < data.collected.length; i++) {
            this.worker.enqueue(_.bind(this.collectedIds.push, this.collectedIds, data.collected[i]));
        }
        this.worker.enqueue(_.bind(Item.prototype.onLoaded, this, data));
    };

    User.prototype.type = 'user';
    User.prototype.relatedType = 'album';
    User.prototype.iconClass = 'glyphicon-user';

    return User;
});
