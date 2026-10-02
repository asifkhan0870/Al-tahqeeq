// src/routes/admin.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const config = require('../config');
const sections = require('../../config/sections');
const posts = require('../models/posts');

const {
  requireAdmin,
  verifyCsrf,
  checkCredentials,
  startSession,
  endSession,
} = require('../middleware/auth');

const {
  cleanContent,
  toPlainText,
  makeExcerpt,
  readingMinutes,
  slugify,
  safeUrl,
} = require('../utils/text');

const router = express.Router();

const base = config.adminPath;

const sectionSlugs =
  sections.map((s) => s.slug);


// ============================================================
// ADMIN RESPONSE HEADERS
// ============================================================

router.use((req, res, next) => {
  res.set(
    'Cache-Control',
    'no-store'
  );

  res.set(
    'X-Robots-Tag',
    'noindex, nofollow'
  );

  res.locals.robotsNoindex = true;
  res.locals.bodyClass = 'admin';
  res.locals.htmlLang = 'en';
  res.locals.htmlDir = 'ltr';

  next();
});


// ============================================================
// MESSAGES
// ============================================================

const MESSAGES = {
  created: 'Post created.',
  saved: 'Changes saved.',
  deleted: 'Post deleted.',
  published: 'Post published.',
  unpublished: 'Post moved to drafts.',
};


// ============================================================
// LOGIN RATE LIMIT
// ============================================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 8,

  standardHeaders: true,

  legacyHeaders: false,

  skipSuccessfulRequests: true,

  handler: (req, res) =>
    res.status(429).render(
      'admin/login',
      {
        pageTitle: 'Admin login',
        error:
          'Too many failed attempts. Please wait 15 minutes and try again.',
      }
    ),
});


// ============================================================
// UPLOAD DIRECTORIES
// ============================================================

const uploadsRoot = path.join(
  __dirname,
  '../../public/uploads'
);

const coversDir = path.join(
  uploadsRoot,
  'covers'
);

const articlesDir = path.join(
  uploadsRoot,
  'articles'
);

for (const directory of [
  uploadsRoot,
  coversDir,
  articlesDir,
]) {
  fs.mkdirSync(
    directory,
    {
      recursive: true,
    }
  );
}


// ============================================================
// IMAGE UPLOAD
// ============================================================

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const extensionForMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};


// Generate a cryptographically random filename.
function generateFilename(mimetype) {
  const extension =
    extensionForMime[mimetype] ||
    '.bin';

  const random =
    crypto.randomBytes(18).toString('hex');

  return `${Date.now()}-${random}${extension}`;
}


// We initially store uploads in the articles
// directory. The route will decide whether
// they are article images or cover images
// after Multer has parsed the multipart body.

const storage =
  multer.diskStorage({

    destination(req, file, cb) {
      cb(null, articlesDir);
    },

    filename(req, file, cb) {
      cb(
        null,
        generateFilename(
          file.mimetype
        )
      );
    },
  });


const upload =
  multer({

    storage,

    limits: {
      fileSize:
        config.uploadMaxBytes,
    },

    fileFilter(req, file, cb) {

      if (
        !allowedMimeTypes.has(
          file.mimetype
        )
      ) {
        return cb(
          new Error(
            'Only JPG, PNG, WebP and GIF images are allowed.'
          )
        );
      }

      cb(null, true);
    },
  });


// ============================================================
// LOGIN
// ============================================================

router.get(
  '/login',
  (req, res) => {

    if (req.admin) {
      return res.redirect(
        base
      );
    }

    res.render(
      'admin/login',
      {
        pageTitle:
          'Admin login',

        error: null,
      }
    );
  }
);


router.post(
  '/login',
  loginLimiter,
  (req, res) => {

    const username =
      String(
        req.body &&
        req.body.username
          ? req.body.username
          : ''
      ).trim();

    const password =
      typeof req.body?.password === 'string'
        ? req.body.password
        : '';

    if (
      !checkCredentials(
        username,
        password
      )
    ) {
      return res
        .status(401)
        .render(
          'admin/login',
          {
            pageTitle:
              'Admin login',

            error:
              'Invalid username or password.',
          }
        );
    }

    startSession(
      res,
      req.body.remember === 'on'
    );

    res.redirect(base);
  }
);


// ============================================================
// LOGOUT
// ============================================================

router.post(
  '/logout',
  requireAdmin,
  verifyCsrf,
  (req, res) => {

    endSession(res);

    res.redirect(
      base + '/login'
    );
  }
);


// ============================================================
// EVERYTHING BELOW REQUIRES LOGIN
// ============================================================

router.use(requireAdmin);


// ============================================================
// DASHBOARD
// ============================================================

router.get(
  '/',
  async (req, res) => {

    const q =
      String(
        req.query.q || ''
      )
        .trim()
        .slice(0, 100);

    const section =
      sectionSlugs.includes(
        req.query.section
      )
        ? req.query.section
        : '';

    const status =
      [
        'published',
        'draft',
      ].includes(
        req.query.status
      )
        ? req.query.status
        : '';

    const page =
      Math.max(
        1,
        parseInt(
          req.query.page,
          10
        ) || 1
      );

    const [
      result,
      stats,
    ] = await Promise.all([
      posts.list({
        q,
        section,
        status,
        page,
        perPage:
          config.adminPerPage,
      }),

      posts.stats(),
    ]);

    const qs = (n) => {

      const params =
        new URLSearchParams();

      if (q) {
        params.set(
          'q',
          q
        );
      }

      if (section) {
        params.set(
          'section',
          section
        );
      }

      if (status) {
        params.set(
          'status',
          status
        );
      }

      if (n > 1) {
        params.set(
          'page',
          n
        );
      }

      const query =
        params.toString();

      return (
        base +
        (
          query
            ? '?' + query
            : ''
        )
      );
    };

    res.render(
      'admin/dashboard',
      {
        pageTitle:
          'Dashboard',

        result,

        stats,

        sections,

        filters: {
          q,
          section,
          status,
        },

        flash:
          MESSAGES[
            req.query.msg
          ] || null,

        pager: {
          page:
            result.page,

          pages:
            result.pages,

          url: qs,
        },
      }
    );
  }
);


// ============================================================
// EMPTY POST
// ============================================================

const emptyPost = {

  id: null,

  title: '',

  slug: '',

  section:
    sectionSlugs[0],

  lang: 'ur',

  excerpt: '',

  content: '',

  cover_url: '',

  download_url: '',

  status: 'draft',
};


// ============================================================
// NEW POST
// ============================================================

router.get(
  '/posts/new',
  (req, res) => {

    const section =
      sectionSlugs.includes(
        req.query.section
      )
        ? req.query.section
        : emptyPost.section;

    res.render(
      'admin/edit',
      {
        pageTitle:
          'New post',

        post: {
          ...emptyPost,
          section,
        },

        // IMPORTANT:
        // The new editor needs this.
        sections,

        error: null,
      }
    );
  }
);


// ============================================================
// EDIT POST
// ============================================================

router.get(
  '/posts/:id/edit',
  async (
    req,
    res,
    next
  ) => {

    if (
      !/^\d{1,9}$/.test(
        req.params.id
      )
    ) {
      return next();
    }

    const post =
      await posts.get(
        parseInt(
          req.params.id,
          10
        )
      );

    if (!post) {
      return next();
    }

    res.render(
      'admin/edit',
      {
        pageTitle:
          'Edit post',

        post,

        // IMPORTANT:
        // The new editor needs this.
        sections,

        error: null,
      }
    );
  }
);


// ============================================================
// READ FORM
// ============================================================

function readForm(body) {

  const title =
    String(
      body.title || ''
    )
      .trim()
      .slice(0, 300);


  const section =
    String(
      body.section || ''
    );


  const lang =
    body.lang === 'ar'
      ? 'ar'
      : 'ur';


  const status =
    body.status === 'published'
      ? 'published'
      : 'draft';


  const content =
    cleanContent(
      String(
        body.content || ''
      ).slice(
        0,
        1_500_000
      )
    );


  const plain =
    toPlainText(
      content
    );


  const excerptIn =
    toPlainText(
      String(
        body.excerpt || ''
      )
    ).slice(
      0,
      400
    );


  const errors = [];


  if (!title) {
    errors.push(
      'Title is required.'
    );
  }


  if (
    !sectionSlugs.includes(
      section
    )
  ) {
    errors.push(
      'Please choose a section.'
    );
  }


  if (!plain) {
    errors.push(
      'The post body is empty.'
    );
  }


  const data = {

    title,

    slug:
      slugify(
        body.slug || ''
      ),

    section,

    lang,

    excerpt:
      excerptIn ||
      makeExcerpt(
        plain
      ),

    content,

    cover_url:
      safeUrl(
        body.cover_url
      ),

    download_url:
      safeUrl(
        body.download_url
      ),

    status,

    read_min:
      readingMinutes(
        plain
      ),
  };


  return {

    data,

    errors,

    rawExcerpt:
      excerptIn,
  };
}


// ============================================================
// CREATE POST
// ============================================================

router.post(
  '/posts',
  verifyCsrf,
  async (
    req,
    res
  ) => {

    const {
      data,
      errors,
      rawExcerpt,
    } = readForm(
      req.body
    );


    if (errors.length) {

      return res
        .status(422)
        .render(
          'admin/edit',
          {
            pageTitle:
              'New post',

            post: {
              ...emptyPost,
              ...data,
              excerpt:
                rawExcerpt,
            },

            sections,

            error:
              errors.join(
                ' '
              ),
          }
        );
    }


    const id =
      await posts.create(
        data
      );


    res.redirect(
      `${base}/posts/${id}/edit?msg=created`
    );
  }
);


// ============================================================
// UPDATE POST
// ============================================================

router.post(
  '/posts/:id',
  verifyCsrf,
  async (
    req,
    res,
    next
  ) => {

    if (
      !/^\d{1,9}$/.test(
        req.params.id
      )
    ) {
      return next();
    }


    const id =
      parseInt(
        req.params.id,
        10
      );


    const {
      data,
      errors,
      rawExcerpt,
    } = readForm(
      req.body
    );


    if (errors.length) {

      return res
        .status(422)
        .render(
          'admin/edit',
          {
            pageTitle:
              'Edit post',

            post: {
              ...emptyPost,
              ...data,
              excerpt:
                rawExcerpt,
              id,
            },

            sections,

            error:
              errors.join(
                ' '
              ),
          }
        );
    }


    const ok =
      await posts.update(
        id,
        data
      );


    if (!ok) {
      return next();
    }


    res.redirect(
      `${base}/posts/${id}/edit?msg=saved`
    );
  }
);


// ============================================================
// IMAGE UPLOAD
//
// IMPORTANT:
// Multer MUST run before verifyCsrf because the request
// is multipart/form-data.
// ============================================================

router.post(
  '/upload-image',

  upload.single('image'),

  verifyCsrf,

  async (
    req,
    res,
    next
  ) => {

    try {

      if (!req.file) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              'Please choose an image.',
          });
      }


      const kind =
        req.body &&
        req.body.kind === 'cover'
          ? 'cover'
          : 'article';


      let targetDir;
      let folder;


      if (kind === 'cover') {

        targetDir =
          coversDir;

        folder =
          'covers';

      } else {

        targetDir =
          articlesDir;

        folder =
          'articles';
      }


      const sourcePath =
        req.file.path;


      const targetPath =
        path.join(
          targetDir,
          req.file.filename
        );


      // Move from temporary article directory
      // to the correct final directory.
      if (
        sourcePath !==
        targetPath
      ) {

        await fs.promises.rename(
          sourcePath,
          targetPath
        );
      }


      const url =
        `/uploads/${folder}/${req.file.filename}`;


      return res.json({

        ok: true,

        url,

        filename:
          req.file.filename,

        size:
          req.file.size,

        type:
          req.file.mimetype,

      });

    } catch (error) {

      return next(error);
    }
  }
);


// ============================================================
// DELETE POST
// ============================================================

router.post(
  '/posts/:id/delete',
  verifyCsrf,
  async (
    req,
    res,
    next
  ) => {

    if (
      !/^\d{1,9}$/.test(
        req.params.id
      )
    ) {
      return next();
    }


    await posts.remove(
      parseInt(
        req.params.id,
        10
      )
    );


    res.redirect(
      `${base}?msg=deleted`
    );
  }
);


// ============================================================
// PUBLISH / UNPUBLISH
// ============================================================

router.post(
  '/posts/:id/toggle',
  verifyCsrf,
  async (
    req,
    res,
    next
  ) => {

    if (
      !/^\d{1,9}$/.test(
        req.params.id
      )
    ) {
      return next();
    }


    const id =
      parseInt(
        req.params.id,
        10
      );


    const post =
      await posts.get(id);


    if (!post) {
      return next();
    }


    const nextStatus =
      post.status === 'published'
        ? 'draft'
        : 'published';


    await posts.setStatus(
      id,
      nextStatus
    );


    res.redirect(
      `${base}?msg=${
        nextStatus === 'published'
          ? 'published'
          : 'unpublished'
      }`
    );
  }
);


module.exports = router;