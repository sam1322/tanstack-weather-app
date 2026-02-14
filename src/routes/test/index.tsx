import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const fetchTodoList = createServerFn({ method: "GET" }).handler(() => {
  return db.query.todos.findMany();
});

export const Route = createFileRoute("/test/")({
  component: RouteComponent,
  ssr:false,
  loader: () => {
    console.log("loading data");
    return fetchTodoList();
  },
});

function RouteComponent() {
  const todos = Route.useLoaderData();
  const completedCount = todos.filter((t) => t.isComplete).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen container space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold"> Todo list</h1>
          {totalCount > 0 && (
            <Badge variant={"outline"}>
              {completedCount} of {totalCount} completed
            </Badge>
          )}
        </div>
        <Button>
          <Link to="/todo/new">Add new </Link>
        </Button>
      </div>
    </div>
  );
}
