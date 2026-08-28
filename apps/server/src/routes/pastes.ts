import { zValidator } from '@hono/zod-validator'
import {
  pasteCreateInputSchema,
  pasteIdParamsSchema,
  pasteLinkParamsSchema,
  pasteUpdateInputSchema,
} from '@psh/shared'
import { Hono } from 'hono'
import * as paste from '../controllers/paste-controller'

export const apiRoutes = new Hono()
  .post(
    '/',
    zValidator('json', pasteCreateInputSchema),
    (c) => {
      return paste.create(c, c.req.valid('json'))
    },
  )
  .patch(
    '/link/:link',
    zValidator('param', pasteLinkParamsSchema),
    zValidator('json', pasteUpdateInputSchema),
    (c) => {
      return paste.patchByLink(c, c.req.valid('param').link, c.req.valid('json'))
    },
  )
  .patch(
    '/id/:id',
    zValidator('param', pasteIdParamsSchema),
    zValidator('json', pasteUpdateInputSchema),
    (c) => {
      return paste.patchById(c, c.req.valid('param').id, c.req.valid('json'))
    },
  )
  .delete(
    '/id/:id',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      return paste.removeById(c, c.req.valid('param').id)
    },
  )
  .get(
    '/link/:link/meta',
    zValidator('param', pasteLinkParamsSchema),
    (c) => {
      return paste.metaByLink(c, c.req.valid('param').link)
    },
  )
  .get(
    '/id/:id/meta',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      return paste.metaById(c, c.req.valid('param').id)
    },
  )
  .get(
    '/link/:link/content',
    zValidator('param', pasteLinkParamsSchema),
    (c) => {
      return paste.contentByLink(c, c.req.valid('param').link, c.req.query('password'))
    },
  )
  .get(
    '/id/:id/content',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      return paste.contentById(c, c.req.valid('param').id, c.req.query('password'))
    },
  )

export const rawRoutes = new Hono()
  .get(
    '/link/:link',
    zValidator('param', pasteLinkParamsSchema),
    (c) => {
      return paste.rawByLink(c, c.req.valid('param').link, c.req.query('password'))
    },
  )
  .get(
    '/id/:id',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      return paste.rawById(c, c.req.valid('param').id, c.req.query('password'))
    },
  )
