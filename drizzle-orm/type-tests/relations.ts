import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from '~/pg-core';
import { type Relation, type Relations, relations } from '~/relations';
import { Expect } from './utils';
import type { Equal } from './utils';

// Authors table
export const authors = pgTable('authors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  bio: text('bio'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Posts table
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  published: boolean('published').default(false).notNull(),
  authorId: integer('author_id')
    .references(() => authors.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const authorsRelations = relations(authors, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(authors, { fields: [posts.authorId], references: [authors.id] }),
}));

type InferRelationConfig<TRelations extends Relations<any, any>> =
  TRelations extends Relations<any, infer TRelationConfig>
    ? TRelationConfig
    : never;

declare function getReferencedTablePrimaryColumn<
  TRelations extends Relations,
  TRelationConfig extends Record<
    string,
    Relation
  > = InferRelationConfig<TRelations>,
  TRelationKey extends keyof TRelationConfig = keyof TRelationConfig,
  TResult = TRelationConfig[TRelationKey],
>(relations: TRelations, relationKey: TRelationKey): TResult;

// Test Many relation

const authorsRelationsResult = getReferencedTablePrimaryColumn(
  authorsRelations,
  'posts',
);

type AuthorsRelationsSourceTable =
  (typeof authorsRelationsResult)['sourceTable'];

type AuthorsRelationsReferencedTable =
  (typeof authorsRelationsResult)['referencedTable'];

// Expect if source table is "authors"
Expect<Equal<AuthorsRelationsSourceTable['_']['name'], 'authors'>>;
// Epect if source table contains email column
Expect<
  Equal<
    AuthorsRelationsSourceTable['_']['columns']['email']['_']['name'],
    'email'
  >
>;

// Expect if referenced table is "posts"
Expect<Equal<AuthorsRelationsReferencedTable['_']['name'], 'posts'>>;
// Expect if referenced table contains authorId column
Expect<
  Equal<
    AuthorsRelationsReferencedTable['_']['columns']['authorId']['_']['name'],
    'author_id'
  >
>;

// Test One relation

const postsRelationsResult = getReferencedTablePrimaryColumn(
  postsRelations,
  'author',
);

type PostsRelationsSourceTable = (typeof postsRelationsResult)['sourceTable'];

type PostsRelationsReferencedTable =
  (typeof postsRelationsResult)['referencedTable'];

// Expect if source table is "posts"
Expect<Equal<PostsRelationsSourceTable['_']['name'], 'posts'>>;
// Epect if source table contains email column
Expect<
  Equal<
    PostsRelationsSourceTable['_']['columns']['authorId']['_']['name'],
    'author_id'
  >
>;

// Expect if referenced table is "authors"
Expect<Equal<PostsRelationsReferencedTable['_']['name'], 'authors'>>;
// Expect if referenced table contains authorId column
Expect<
  Equal<PostsRelationsReferencedTable['_']['columns']['id']['_']['name'], 'id'>
>;
