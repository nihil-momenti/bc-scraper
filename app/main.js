define([
    'knockout',
    './canvas',
    './simulation',
    './cache',
    './worker',
    './settings'
], function (ko, Canvas, Simulation, Cache, Worker, Settings) {
    var settings = new Settings('settings', {
        damping: 0.5,
        attraction: 0.01,
        repulsion: 10,
        displacement: 0,
        updateLayout: true,
        runSimulation: true,
    });
    var stats = new Settings('stats', {
        entities: 0,
        processedLastFrame: 0,
        remainingItems: 0,
        layoutTime: 0,
        simulationTime: 0,
    });
    settings.load();

    var worker = new Worker(stats);

    var app = {
        worker: worker,
        settings: settings,
        stats: stats,
        canvas: new Canvas(settings, stats),
        simulation: new Simulation(settings, stats),
        cache: new Cache(worker),
        search: ko.observable(),
        clicked: ko.observable(),
        mouseOvered: ko.observable(),
        doSearch: function () {
            var item;
            if (this.search().match(/https?:\/\/bandcamp\.com\/.*/i)) {
                item = this.cache.createUser(this.canvas, this.simulation, this.search());
            } else {
                item = this.cache.createAlbum(this.canvas, this.simulation, this.search());
            }
            item.locked(true);
            item.bound = true;
            item.load();
            this.canvas.clear();
            this.simulation.clear();
            this.canvas.add(item);
            this.simulation.add(item);
            this.canvas.panTo(0, 0);
        }
    };

    app.selection = ko.computed(() => app.clicked() || app.mouseOvered());
    app.canvas.setSize($('#canvas').width(), $('#canvas').height());

    $(window).on('resize', function (event) {
        app.canvas.setSize($('#canvas').width(), $('#canvas').height());
    });

    $(window).on('mousewheel', function (event) {
        app.canvas.panBy(event.originalEvent.deltaX, event.originalEvent.deltaY);
        event.preventDefault();
    });

    app.onItemClick = function (item, event) {
        app.clicked(item);
    };

    app.onCanvasClick = function () {
        app.clicked(null);
    };

    app.onItemMouseOver = function (item) {
        app.mouseOvered(item);
    };

    ko.applyBindings(app);

    return app;
});
