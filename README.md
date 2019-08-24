# linear-node-api

Node wrapper for Linear.app GraphQL API

## Usage

```javascript
import Linear from "linear-node-api";

const linear = new Linear(
  process.env.LINEAR_API_TOKEN,
  process.env.LINEAR_TEAM_KEY
);

await linear.createIssue({
  title: "Issue title",
  description: "Optional description",
  label: "bug",
  assignee: "emil",
  state: "todo",
  project: "My Project"
});
```
