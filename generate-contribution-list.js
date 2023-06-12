const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

async function run() {
  try {
    const username = core.getInput('username');
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);

    const { data: repos } = await octokit.repos.listForUser({
      username: username,
      per_page: 100,
    });

    const contributions = [];

    for (const repo of repos) {
      const { data: commits } = await octokit.repos.listCommits({
        owner: repo.owner.login,
        repo: repo.name,
        author: username,
        per_page: 1,
      });

      if (commits.length > 0) {
        contributions.push(`- [${repo.name}](${repo.html_url})`);
      }
    }

    const contributionList = contributions.join('\n');

    const readmePath = `${process.env.GITHUB_WORKSPACE}/README.md`;
    let readmeContent = fs.readFileSync(readmePath, 'utf8');
    readmeContent = readmeContent.replace(/<!-- CONTRIBUTION-LIST:START -->(.|\n)*<!-- CONTRIBUTION-LIST:END -->/, `<!-- CONTRIBUTION-LIST:START -->\n${contributionList}\n<!-- CONTRIBUTION-LIST:END -->`);
    fs.writeFileSync(readmePath, readmeContent);

    core.setOutput('contributionList', contributionList);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();