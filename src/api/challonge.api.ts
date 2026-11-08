import HttpApi from "@/lib/http.utils";

export default class ChallongeApi {
  private readonly http: HttpApi;

  constructor(http: HttpApi = new HttpApi()) {
    this.http = http;
  }

  getModuleHtml(url: string): Promise<string> {
    const query = encodeURIComponent(url);
    return this.http.text(`/challonge?url=${query}`, "Не удалось загрузить турнир с Challonge");
  }
}
