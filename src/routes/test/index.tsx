import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { todos } from "@/db/schema";
import { createFileRoute, defer, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import z from "zod";

const fetchTodoList = createServerFn({ method: "GET" }).handler(() => {
  return db.query.todos.findMany();
});

// Server function to toggle complete status
const toggleTodoFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    // 1. First get the current todo
    // const todo = await db.query.todos.findFirst({
    //   where: eq(todos.id, data.id),
    // });

    // // 2. Toggle the isComplete value
    // await db
    //   .update(todos)
    //   .set({ isComplete: !todo?.isComplete })
    //   .where(eq(todos.id, data.id));

      await db.update(todos)
      .set({ 
        isComplete: sql`NOT ${todos.isComplete}` 
      })
      .where(eq(todos.id, data.id));
    
    return { success: true };
  });

const deleteTodoFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(todos).where(eq(todos.id, data.id));

    return { success: true };
  });

export const Route = createFileRoute("/test/")({
  component: RouteComponent,
  ssr: true,
  loader: () => {
    console.log("loading data");
    return fetchTodoList();
    
    // use this later
    // return {
    //   // We "defer" this promise so the page shell loads first
    //   todoPromise: defer(fetchTodoList()) 
    // }
  },
});

function RouteComponent() {
  const todos = Route.useLoaderData();
  const router = useRouter();
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  
  
  const toggleTodo = useServerFn(toggleTodoFn);
  const deleteTodo = useServerFn(deleteTodoFn);

  const handleToggle = async (id: string) => {
    await toggleTodo({ data: { id } });
    router.invalidate(); // Refresh the list
  };

  const handleDelete = async (id: string) => {
    await deleteTodo({ data: { id } });
    router.invalidate();
  };
  const completedCount = todos.filter((t) => t.isComplete).length;
  const totalCount = todos.length;

  if (isLoading) {
    return <div>Loading todos...</div>;
  }

  return (
    <div className="min-h-screen  space-y-8">
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

      {/* Todo list */}
      <div className="flex flex-col items-center">
        <div className="space-y-2 min-w-2xl">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              <Button
                onClick={() => handleToggle(todo.id)}
                className="w-6 h-6 border-2 rounded flex items-center justify-center"
              >
                {todo.isComplete && "✓"}
              </Button>
              <span
                className={todo.isComplete ? "line-through text-gray-400" : ""}
              >
                {todo.name}
              </span>
              {/* Delete button - push to the right */}
              <button
                onClick={() => handleDelete(todo.id)}
                className="ml-auto text-red-500 hover:text-red-700 cursor-pointer"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
