define([
    'knockout',
    'jquery',
    'lodash'
], function (ko, $, _) {
    function Canvas(worker) {
        this.worker = worker;
        this.width = this.height = 0;
        this.users = ko.observableArray();
        this.albums = ko.observableArray();
        this.items = ko.computed(_.bind(function () {
            return [].concat(this.users()).concat(this.albums());
        }, this));
        this.left = ko.observable(0);
        this.top = ko.observable(0);
        this.settings = {
            damping: ko.observable(0.5),
            attraction: ko.observable(0.01),
            repulsion: ko.observable(10),
            displacement: ko.observable(0),
            updateLayout: ko.observable(true)
        };

        this.worker.addRepeating(_.bind(function () {
            if (this.settings.updateLayout()) {
                this.doRelayout();
            }
        }, this));

        this.worker.addRepeating(_.bind(function () {
            if (this.settings.updateLayout()) {
                this.doSimulate();
            }
        }, this));

    }

    Canvas.prototype.clear = function () {
        _.forEach(this.items(), function (item) { item.displayed(false); }, this);
        this.users.removeAll();
        this.albums.removeAll();
    };

    Canvas.prototype.add = function (items) {
        if (items.type) {
            if (items.type === 'user') {
                items.displayed(true);
                this.users.push(items);
            } else if (items.type === 'album') {
                items.displayed(true);
                this.albums.push(items);
            }
        }
    };

    Canvas.prototype.doRelayout = function () {
        var items = this.items();

        var displacement = 0;
        var localDisplacement = 0;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            localDisplacement = Math.abs(item.pos.x - item.x()) + Math.abs(item.pos.y - item.y());
            if (localDisplacement > 0.5) {
                displacement += localDisplacement;
                item.x(item.pos.x);
                item.y(item.pos.y);
            }
        }

        this.settings.displacement(displacement);
    };

    Canvas.prototype.doSimulate = function () {
        this.repel();
        this.attract();
        this.displace();
    };

    Canvas.prototype.repel = function () {
        var items = this.items();

        var repulsion = this.settings.repulsion();

        for (var i = 0; i < items.length; i++) {
            var item1 = items[i];
            item1.force.x = item1.force.y = 0;
            for (var j = 0; j < items.length; j++) {
                if (i === j) continue;
                var item2 = items[j];
                var dsq = (item1.pos.x - item2.pos.x) * (item1.pos.x - item2.pos.x) + (item1.pos.y - item2.pos.y) * (item1.pos.y - item2.pos.y);
                if (dsq === 0) { dsq = 0.001; }
                var coul = repulsion / dsq;
                item1.force.x += coul * (item1.pos.x - item2.pos.x);
                item1.force.y += coul * (item1.pos.y - item2.pos.y);
            }
        }
    };

    Canvas.prototype.attract = function () {
        var users = this.users();
        var albums = this.albums();

        var attraction = this.settings.attraction();

        var i, j, item1, item2, related;
        for (i = 0; i < users.length; i++) {
            item1 = users[i];
            related = item1.relatedDisplayed();
            for (j = 0; j < related.length; j++) {
                item2 = related[j];
                item1.force.x += attraction * (item2.pos.x - item1.pos.x);
                item1.force.y += attraction * (item2.pos.y - item1.pos.y);
                item2.force.x += attraction * (item1.pos.x - item2.pos.x);
                item2.force.y += attraction * (item1.pos.y - item2.pos.y);
            }
        }

        for (i = 0; i < albums.length; i++) {
            item1 = albums[i];
            related = item1.relatedDisplayed();
            for (j = 0; j < related.length; j++) {
                item2 = related[j];
                if (!item2.loaded()) {
                    item1.force.x += attraction * (item2.pos.x - item1.pos.x);
                    item1.force.y += attraction * (item2.pos.y - item1.pos.y);
                    item2.force.x += attraction * (item1.pos.x - item2.pos.x);
                    item2.force.y += attraction * (item1.pos.y - item2.pos.y);
                }
            }
        }
    };

    Canvas.prototype.displace = function () {
        var items = this.items();

        var damping = this.settings.damping();

        var temp_pos = { x: 0, y: 0 };
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.bound) continue;
            temp_pos.x = item.pos.x;
            temp_pos.y = item.pos.y;
            item.pos.x += (item.pos.x - item.last_pos.x) * damping + item.force.x;
            item.pos.y += (item.pos.y - item.last_pos.y) * damping + item.force.y;
            item.last_pos.x = temp_pos.x;
            item.last_pos.y = temp_pos.y;
        }
    };

    Canvas.prototype.setSize = function (width, height) {
        this.panBy((this.width - width) / 2, (this.height - height) / 2);
        this.width = width;
        this.height = height;
    };

    Canvas.prototype.panBy = function (deltaX, deltaY) {
        this.left(this.left() - deltaX);
        this.top(this.top() - deltaY);
    };

    Canvas.prototype.panTo = function (x, y) {
        this.left(this.width / 2 - x);
        this.top(this.height / 2 - y);
    };

    return Canvas;
});
