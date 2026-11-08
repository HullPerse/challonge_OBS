import HttpUtils from "@/lib/server/http.utils";
import { Elysia } from "elysia";
import type ChallongeService from "../services/challonge.service";

export default class ChallongeRoutes {
  private readonly challonge: ChallongeService;

  constructor(challonge: ChallongeService) {
    this.challonge = challonge;
  }

  plugin() {
    return new Elysia({ name: "challonge" })
      .get("/api/challonge", ({ request }) => this.challonge.proxy(request))
      .post("/api/challonge", () => HttpUtils.methodNotAllowed());
  }
}
