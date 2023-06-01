import rss from "../../app/rss.app";
import { defineSource } from "@pipedream/types";
import rssCommon from "../common/common";

export default defineSource({
  ...rssCommon,
  key: "rss-new-item-in-feed",
  name: "New Item in Feed",
  description: "Emit new items from an RSS feed",
  version: "1.2.3",
  type: "source",
  dedupe: "unique",
  props: {
    ...rssCommon.props,
    url: {
      propDefinition: [
        rss,
        "url",
      ],
    },
    publishedAfterThan: {
      type: "string",
      label: "Published After Than",
      description: "Emit items published after the specified date in ISO 8601 format .e.g `2022-12-07T12:57:10+07:00`",
      optional: true,
    },
  },
  hooks: {
    async activate() {
      // Try to parse the feed one time to confirm we can fetch and parse.
      // The code will throw any errors to the user.
      await this.rss.fetchAndParseFeed(this.url);
    },
  },
  methods: {
    ...rssCommon.methods,
    generateMeta: function (item) {
      return {
        id: this.rss.itemKey(item),
        summary: item.title,
        ts: Date.now(),
      };
    },
  },
  async run() {
    const previousIds = this.getPreviousIds();

    const items = await this.rss.fetchAndParseFeed(this.url);
    for (const item of items.reverse()) {
      if (this.publishedAfterThan) {
        const publishedAfterThan = +new Date(this.publishedAfterThan);
        const ts = this.rss.itemTs(item);
        if (Number.isNaN(publishedAfterThan) || publishedAfterThan > ts) {
          continue;
        }
      }
      const meta = this.generateMeta(item);
      if (!previousIds[meta.id]) {
        this.$emit(item, meta);
        previousIds[meta.id] = true;
      }
    }

    this.setPreviousIds(previousIds);
  },
});
