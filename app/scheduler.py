import asyncio
from aiohttp import web
import json
from ytdl import DownloadQueue
from datetime import datetime
import croniter


class SchedulerQueue:
    def __init__(self, config, download_queue):
        self.config = config
        self.download_queue = download_queue
        self.schedules = []
        self.tasks = {}

    async def add_schedule(self, url, cron, folder):
        schedule = {
            "id": len(self.schedules),
            "url": url,
            "cron": cron,
            "folder": folder,
            "last_run": None,
            "next_run": None,
        }
        self.schedules.append(schedule)
        self.update_next_run(schedule)
        self.tasks[schedule["id"]] = asyncio.create_task(self.run_schedule(schedule))
        return schedule

    def update_next_run(self, schedule):
        cron = croniter.croniter(schedule["cron"], datetime.now())
        schedule["next_run"] = cron.get_next(datetime)

    async def run_schedule(self, schedule):
        while True:
            now = datetime.now()
            if schedule["next_run"] <= now:
                await self.download_queue.add(
                    schedule["url"], "best", None, schedule["folder"], "", True
                )
                schedule["last_run"] = now
                self.update_next_run(schedule)
            await asyncio.sleep(60)  # Check every minute

    async def update_schedules(self, ids, new_cron):
        for id in ids:
            if 0 <= id < len(self.schedules):
                self.schedules[id]["cron"] = new_cron
                self.update_next_run(self.schedules[id])
                self.tasks[id].cancel()
                self.tasks[id] = asyncio.create_task(
                    self.run_schedule(self.schedules[id])
                )
        return {"status": "ok"}

    async def remove_schedules(self, ids):
        for id in sorted(ids, reverse=True):
            if 0 <= id < len(self.schedules):
                self.tasks[id].cancel()
                del self.tasks[id]
                del self.schedules[id]
        return {"status": "ok"}

    def get_schedules(self):
        return self.schedules


class ObjectSerializer(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, object):
            return obj.__dict__
        else:
            return json.JSONEncoder.default(self, obj)


def create_scheduler(config):
    serializer = ObjectSerializer()
    download_queue = DownloadQueue(config, None)
    scheduler_queue = SchedulerQueue(config, download_queue)

    async def add_schedule(request):
        post = await request.json()
        url = post.get("url")
        cron = post.get("cron")
        folder = post.get("folder")
        if not url or not cron:
            raise web.HTTPBadRequest()
        schedule = await scheduler_queue.add_schedule(url, cron, folder)
        return web.Response(text=serializer.encode(schedule))

    async def update_schedules(request):
        post = await request.json()
        ids = post.get("ids")
        new_cron = post.get("cron")
        if not ids or not new_cron:
            raise web.HTTPBadRequest()
        status = await scheduler_queue.update_schedules(ids, new_cron)
        return web.Response(text=serializer.encode(status))

    async def remove_schedules(request):
        post = await request.json()
        ids = post.get("ids")
        if not ids:
            raise web.HTTPBadRequest()
        status = await scheduler_queue.remove_schedules(ids)
        return web.Response(text=serializer.encode(status))

    async def list_schedules(request):
        schedules = scheduler_queue.get_schedules()
        return web.Response(text=serializer.encode(schedules))

    return {
        "add_schedule": add_schedule,
        "update_schedules": update_schedules,
        "remove_schedules": remove_schedules,
        "list_schedules": list_schedules,
    }


def scheduler(app, config):
    routes = create_scheduler(config)

    app.router.add_post(config.URL_PREFIX + "scheduler/add", routes["add_schedule"])
    app.router.add_post(
        config.URL_PREFIX + "scheduler/update", routes["update_schedules"]
    )
    app.router.add_post(
        config.URL_PREFIX + "scheduler/remove", routes["remove_schedules"]
    )
    app.router.add_get(config.URL_PREFIX + "scheduler/list", routes["list_schedules"])

    return app
