import { LinearClient } from "./client";

interface Team {
  id: string;
  issueLabels: Array<{
    id: string;
    name: string;
  }>;
  organization: {
    users: Array<{
      id: string;
      displayName: string;
    }>;
  };
  states: Array<{
    id: string;
    name: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
  }>;
}

interface NewIssue {
  title: string;
  description?: string;
  label?: string;
  assignee?: string;
  state?: string;
  project?: string;
}

export class Linear {
  private client: LinearClient;
  private team: string;

  constructor(apiKey: string, team: string) {
    this.client = new LinearClient(apiKey);
    this.team = team;
  }

  private async getTeam() {
    const response = await this.client.request(
      `
            query getTeam($team: String!) {
                team(id: $team) {
                    id
                    issueLabels {
                        id
                        name
                    }
                    organization {
                        users {
                            id
                            displayName
                        }
                    }
                    states {
                        id
                        name
                    }
                    projects {
                        id
                        name
                    }
                }
            }
        `,
      { team: this.team }
    );

    return response.team as Team;
  }

  public async createIssue(issue: NewIssue) {
    const team = await this.getTeam();

    const assignee = issue.assignee
      ? team.organization.users.find((u: any) => {
          return u.displayName.toLowerCase() == issue.assignee.toLowerCase();
        })
      : null;

    const label = issue.label
      ? team.issueLabels.find((l: any) => {
          return l.name.toLowerCase() == issue.label.toLowerCase();
        })
      : null;

    const state = issue.state
      ? team.states.find((s: any) => {
          return s.name.toLowerCase() == issue.state.toLowerCase();
        })
      : null;

    const project = issue.project
      ? team.projects.find((p: any) => {
          return p.name.toLowerCase() == issue.project.toLowerCase();
        })
      : null;

    await this.client.request(
      `mutation createIssue(
            $teamId: String!, 
            $title: String!, 
            $description: String, 
            $labelIds: [String!]!, 
            $assigneeId: String,
            $stateId: String,
            $projectId: String,
        ) {
            issueCreate(
                input: {
                    teamId: $teamId
                    title: $title
                    description: $description
                    assigneeId: $assigneeId
                    stateId: $stateId
                    labelIds: $labelIds
                }
            ) {
                lastSyncId
            }
        }
        `,
      {
        teamId: team.id,
        title: issue.title,
        description: issue.description,
        labelIds: label ? [label.id] : [],
        assigneeId: assignee ? assignee.id : null,
        stateId: state ? state.id : null,
        projectId: project ? project.id : null
      }
    );
  }
}
