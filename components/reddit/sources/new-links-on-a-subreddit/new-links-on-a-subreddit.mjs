import common from "../common.mjs";
import get from "lodash/get.js";
const { reddit } = common.props;

export default {
  ...common,
  type: "source",
  key: "reddit-new-links-on-a-subreddit",
  name: "New Links on a subreddit",
  description: "Emit new event each time a new link is added to a subreddit",
  version: "0.0.4",
  dedupe: "unique",
  props: {
    ...common.props,
    subreddit: {
      propDefinition: [
        reddit,
        "subreddit",
      ],
    },
  },
  hooks: {
    async deploy() {
      // Emits 10 sample events on the first run during deploy.
      var redditLinks = await this.reddit.getNewSubredditLinks(
        get(this.subreddit, "value", this.subreddit),
        {
          limit: 10,
        },
      );
      const { children: links = [] } = redditLinks.data;
      if (links.length === 0) {
        console.log("No data available, skipping iteration");
        return;
      }
      const { name: before = this.db.get("before") } = links[0].data;
      this.db.set("before", before);
      links.reverse().forEach(this.emitRedditEvent);
    },
  },
  methods: {
    ...common.methods,
    generateEventMetadata(redditEvent) {
      return {
        id: redditEvent.data.name,
        summary: redditEvent.data.title,
        ts: redditEvent.data.created,
      };
    },
  },
  async run() {
    let redditLinks;
    do {
      redditLinks = await this.reddit.getNewSubredditLinks(
        get(this.subreddit, "value", this.subreddit),
        {
          before: this.db.get("before"),
        },
      );
      const { children: links = [] } = redditLinks.data;
      if (links.length === 0) {
        console.log("No data available, skipping iteration");
        break;
      }
      const { name: before = this.db.get("before") } = links[0].data;
      this.db.set("before", before);
      links.reverse().forEach(this.emitRedditEvent);
    } while (redditLinks);
  },
};