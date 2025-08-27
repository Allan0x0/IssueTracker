import { IssueStatus } from "~/issues.js";
import { PrismaClient } from "../app/generated/prisma/client.js";

const prisma = new PrismaClient();

export async function main() {
  console.log("Deleting all records...");
  await prisma.issue.deleteMany();
  await prisma.issueType.deleteMany();
  await prisma.user.deleteMany();
  console.log("Done deleting all records");

  console.log("Creating admin record...");
  await prisma.user.create({
    data: {
      username: "Admin",
      password: "default@7891",
      isAdmin: true,
      firstName: "FirstName",
      lastName: "LastName",
    }
  });
  console.log("Created admin record");

  console.log("Creating users...");
  for (let i = 0; i < 5; i++) {
    await prisma.user.create({
      data: {
        username: "User" + i,
        password: "default@7891",
        isAdmin: false,
        firstName: "FirstName" + i,
        lastName: "LastName" + i,
      }
    });
  }
  console.log("Created users");
  const users = await prisma.user.findMany({
    where: { isAdmin: false } 
  });

  console.log("Created issue types...");
  const kinds = ['POS', 'Printer', 'App'];
  for (const kind of kinds) {
    const issue = await prisma.issueType.create({
      data: { identifier: kind }
    });
    console.log("Created issue type", kind);

    for (let user of users) {
      console.log("Creating issues under user", user.username, "...");
      const statuses = [IssueStatus.Pending, IssueStatus.Resolved];
      for (let status of statuses) {
        await prisma.issue.create({
          data: {
            userId: user.id,
            issueTypeId: issue.id,
            status,
            description: `Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur`
          }
        });
      }
    }
  }

  console.log("Done");
}

main();