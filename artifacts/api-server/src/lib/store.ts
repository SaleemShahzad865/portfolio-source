// Store selector: uses Postgres (Drizzle) when DATABASE_URL is set,
// otherwise falls back to the local JSON store.
//
// This lets local dev work without provisioning a database, while production
// deployments can be fully persistent.

import * as local from "./local-store";

type StoreModule = typeof local;

let storePromise: Promise<StoreModule> | null = null;

async function getStore(): Promise<StoreModule> {
  if (!process.env.DATABASE_URL) return local;

  if (!storePromise) {
    storePromise = import("./postgres-store").then((m) => m);
  }

  return storePromise;
}

export async function listPosts() {
  return (await getStore()).listPosts();
}
export async function getPostById(id: number) {
  return (await getStore()).getPostById(id);
}
export async function getPostBySlug(slug: string) {
  return (await getStore()).getPostBySlug(slug);
}
export async function createPost(data: Parameters<StoreModule["createPost"]>[0]) {
  return (await getStore()).createPost(data);
}
export async function updatePost(
  id: number,
  data: Parameters<StoreModule["updatePost"]>[1],
) {
  return (await getStore()).updatePost(id, data);
}
export async function deletePost(id: number) {
  return (await getStore()).deletePost(id);
}

export async function listProjects() {
  return (await getStore()).listProjects();
}
export async function getProjectById(id: number) {
  return (await getStore()).getProjectById(id);
}
export async function createProject(
  data: Parameters<StoreModule["createProject"]>[0],
) {
  return (await getStore()).createProject(data);
}
export async function updateProject(
  id: number,
  data: Parameters<StoreModule["updateProject"]>[1],
) {
  return (await getStore()).updateProject(id, data);
}
export async function deleteProject(id: number) {
  return (await getStore()).deleteProject(id);
}

export async function listSections() {
  return (await getStore()).listSections();
}
export async function getSectionByKey(key: string) {
  return (await getStore()).getSectionByKey(key);
}
export async function upsertSection(key: string, value: string) {
  return (await getStore()).upsertSection(key, value);
}

export async function createSession(user: Parameters<StoreModule["createSession"]>[0]) {
  return (await getStore()).createSession(user);
}
export async function getSession(sid: string) {
  return (await getStore()).getSession(sid);
}
export async function deleteSession(sid: string) {
  return (await getStore()).deleteSession(sid);
}

export async function listContactMessages(
  opts?: Parameters<StoreModule["listContactMessages"]>[0],
) {
  return (await getStore()).listContactMessages(opts);
}
export async function getContactMessageById(id: number) {
  return (await getStore()).getContactMessageById(id);
}
export async function createContactMessage(
  data: Parameters<StoreModule["createContactMessage"]>[0],
) {
  return (await getStore()).createContactMessage(data);
}
export async function updateContactMessage(
  id: number,
  data: Parameters<StoreModule["updateContactMessage"]>[1],
) {
  return (await getStore()).updateContactMessage(id, data);
}
export async function deleteContactMessage(id: number) {
  return (await getStore()).deleteContactMessage(id);
}
