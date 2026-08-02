import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/contact", async (req, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(data);
      res.status(201).json({ success: true, id: contact.id });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, errors: error.errors });
      } else {
        console.error("Contact submission error:", error);
        res.status(500).json({ success: false, message: "Failed to submit message" });
      }
    }
  });

  return httpServer;
}
