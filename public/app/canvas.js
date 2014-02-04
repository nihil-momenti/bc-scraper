define([
    'knockout',
    'jquery',
    'lodash'
], function (ko, $, _) {
    function Canvas() {
        this.users = ko.observableArray();
        this.albums = ko.observableArray();
        this.items = ko.computed(_.bind(function () {
            return [].concat(this.users()).concat(this.albums());
        }, this));
        this.left = ko.observable(0);
        this.top = ko.observable(0);
        this.damping = ko.observable(0.5);
        this.attraction = ko.observable(0.01);
        this.repulsion = ko.observable(10);
        this.displacement = ko.observable(0);
        window.requestAnimationFrame(_.bind(this.relayout, this));
    }

    Canvas.prototype.clear = function () {
        _.forEach(this.items(), function (item) { item.displayed(false); }, this);
        this.users.removeAll();
        this.albums.removeAll();
    };

    Canvas.prototype.addUsers = function (users) {
        _.forEach(users, function (user) { user.displayed(true); }, this);
        ko.utils.arrayPushAll(this.users, users);
    };

    Canvas.prototype.addAlbums = function (albums) {
        _.forEach(albums, function (album) { album.displayed(true); }, this);
        ko.utils.arrayPushAll(this.albums, albums);
    };

    Canvas.prototype.relayout = function () {
        var items = this.items();
        var users = this.users();
        var albums = this.albums();

        var repulsion = this.repulsion();
        var attraction = this.attraction();
        var damping = this.damping();

        var dsq, coul, i, j, item1, item2;
        for (i = 0; i < items.length; i++) {
            item1 = items[i];
            item1.force.x = item1.force.y = 0;
            for (j = 0; j < items.length; j++) {
                if (i === j) continue;
                item2 = items[j];
                dsq = (item1.pos.x - item2.pos.x) * (item1.pos.x - item2.pos.x) + (item1.pos.y - item2.pos.y) * (item1.pos.y - item2.pos.y);
                if (dsq === 0) { dsq = 0.001; }
                coul = repulsion / dsq;
                item1.force.x += coul * (item1.pos.x - item2.pos.x);
                item1.force.y += coul * (item1.pos.y - item2.pos.y);
            }
        }

        var related;
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

        var item;
        var displacement = 0;
        var temp_pos = { x: 0, y: 0 };
        for (i = 0; i < items.length; i++) {
            item = items[i];
            temp_pos.x = item.pos.x;
            temp_pos.y = item.pos.y;
            item.pos.x += (item.pos.x - item.last_pos.x) * damping + item.force.x;
            item.pos.y += (item.pos.y - item.last_pos.y) * damping + item.force.y;
            displacement += Math.abs(item.pos.x - temp_pos.x) + Math.abs(item.pos.y - temp_pos.y);
            item.last_pos.x = temp_pos.x;
            item.last_pos.y = temp_pos.y;
            item.position(item.pos);
        }

        this.displacement(displacement);
        window.requestAnimationFrame(_.bind(this.relayout, this));
    };

    Canvas.prototype.onMouseWheel = function (event) {
        this.left(this.left() - event.originalEvent.deltaX);
        this.top(this.top() - event.originalEvent.deltaY);
        event.preventDefault();
    };

    return Canvas;
});
