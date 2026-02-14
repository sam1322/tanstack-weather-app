import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { todos } from "@/db/schema";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";

// ============================================
// STEP 1: Create the Server Function
// ============================================
// This server function runs on the server side and handles
const todoInputSchema = z.object({
  name: z
    .string()
    .min(1, "Todo name is required")
    .max(100, "Todo name too long"),
});
const createTodoFn = createServerFn({ method: "POST" })
  .inputValidator(todoInputSchema)
  .handler(async ({ data }) => {
    const result = await db.insert(todos).values({
      name: data.name,
      isComplete: false,
    }).returning();
      console.log("printing result",result)
    return result[0]
  });

// Create the server function with POST method (for mutations)
const addTodo = createServerFn({ method: "POST" })
  // Validate input using Zod schema
  .inputValidator(todoInputSchema)
  // Handler receives validated data in { data } parameter
  .handler(async ({ data }) => {
    // Insert new todo into database using Drizzle
    const result = await db
      .insert(todos)
      .values({
        name: data.name,
        isComplete: false, // New todos start as incomplete
      })
      .returning(); // Return the inserted row
      console.log("printing result",result)
    return result[0]; // Return the created todo
  });

export const Route = createFileRoute("/todo/new")({
  component: AddTodoForm,
});

function AddTodoForm() {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  // Hook for invalidating router cache (refreshes data)
  const router = useRouter();

  const createTodo = useServerFn(createTodoFn); // Wrapping the function


  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if empty or already submitting
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Call the server function with the input data
      await createTodo({ data: { name: name.trim() } });

      // Clear the input
      setName("");

      // Invalidate the router to refresh the todo list
      // This ensures the /test route loader runs again
      router.invalidate();

      // Navigate back to the todo list
      navigate({ to: "/test" });
    } catch (error) {
      console.error("Failed to add todo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen container max-w-md mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Todo</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input field for todo name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Todo Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your todo..."
            className="w-full px-4 text-black py-3 rounded-lg border border-gray-300 dark:border-gray-700 
                       bg-white dark:bg-gray-800 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Adding..." : "Add Todo"}
        </Button>

        {/* Cancel button to go back */}
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/test" })}
          className="w-full"
        >
          Cancel
        </Button>
      </form>
    </div>
  );
}
