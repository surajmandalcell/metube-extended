from aiohttp import web


def get_schedule(app, config):
    @app.router.add_get(config.URL_PREFIX + "scheduler")
    async def scheduler_route(request):
        print(f"Accessed route: {request.path}")
        return web.Response(text="Scheduler route accessed")


def scheduler(app, config):
    get_schedule(app, config)
    return app
