(() => {
  'use strict';

  const form =
    document.getElementById('postForm');

  const editorElement =
    document.getElementById('editor');

  if (!form || !editorElement || typeof Quill === 'undefined') {
    return;
  }

  const csrf =
    document.querySelector(
      'input[name="_csrf"]'
    )?.value || '';

  const initialContent =
    document.getElementById(
      'initialContent'
    )?.value || '';

  const titleInput =
    document.getElementById('title');

  const titleCount =
    document.getElementById('titleCount');

  const excerpt =
    document.getElementById('excerpt');

  const excerptCount =
    document.getElementById('excerptCount');

  const wordCount =
    document.getElementById('wordCount');

  const charCount =
    document.getElementById('charCount');

  const saveState =
    document.getElementById('saveState');

  const saveStateText =
    saveState?.querySelector(
      '.save-state-text'
    );

  const saveButton =
    document.getElementById(
      'savePostButton'
    );

  const languageInputs =
    document.querySelectorAll(
      'input[name="lang"]'
    );

  const statusInput =
    document.getElementById('status');

  const publishStatusText =
    document.getElementById(
      'publishStatusText'
    );

  const coverInput =
    document.getElementById(
      'coverImage'
    );

  const coverUrl =
    document.getElementById(
      'coverUrl'
    );

  const coverPreview =
    document.getElementById(
      'coverPreview'
    );

  const coverStatus =
    document.getElementById(
      'coverUploadStatus'
    );


  /* =========================================================
     QUILL CONFIGURATION
     ========================================================= */

  const Font =
    Quill.import(
      'formats/font'
    );

  Font.whitelist = [
    'urdu',
    'naskh',
    'amiri',
    'sans',
  ];

  Quill.register(
    Font,
    true
  );


  const Size =
    Quill.import(
      'attributors/style/size'
    );

  Size.whitelist = [
    '14px',
    '16px',
    '18px',
    '22px',
    '26px',
    '32px',
  ];

  Quill.register(
    Size,
    true
  );


  /* =========================================================
     IMAGE HANDLER
     ========================================================= */

  async function uploadArticleImage(file) {

    if (!file) return null;

    if (!file.type.startsWith('image/')) {
      throw new Error(
        'Please choose an image file.'
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        'Image must be smaller than 5 MB.'
      );
    }

    const data =
      new FormData();

    data.append(
      '_csrf',
      csrf
    );

    data.append(
      'kind',
      'article'
    );

    data.append(
      'image',
      file
    );

    const response =
      await fetch(
        `${window.ADMIN_BASE || '/admin'}/upload-image`,
        {
          method: 'POST',
          body: data,
          credentials: 'same-origin',
        }
      );

    const result =
      await response.json()
        .catch(() => null);

    if (
      !response.ok ||
      !result ||
      !result.ok
    ) {
      throw new Error(
        result?.error ||
        'Image upload failed.'
      );
    }

    return result.url;
  }


  function imageHandler() {

    const input =
      document.createElement(
        'input'
      );

    input.type = 'file';

    input.accept =
      'image/jpeg,image/png,image/webp,image/gif';

    input.click();

    input.addEventListener(
      'change',
      async () => {

        const file =
          input.files?.[0];

        if (!file) return;

        try {

          setSaveState(
            'Uploading image...',
            'uploading'
          );

          const url =
            await uploadArticleImage(
              file
            );

          const range =
            quill.getSelection(
              true
            ) || {
              index:
                quill.getLength(),
            };

          quill.insertEmbed(
            range.index,
            'image',
            url,
            'user'
          );

          quill.setSelection(
            range.index + 1,
            0,
            'silent'
          );

          markDirty();

          setSaveState(
            'Image uploaded',
            'saved'
          );

        } catch (error) {

          alert(
            error.message ||
            'Unable to upload image.'
          );

          setSaveState(
            'Ready',
            'ready'
          );
        }
      }
    );
  }


  /* =========================================================
     QUILL TOOLBAR
     ========================================================= */

  const toolbarOptions = [
    [
      {
        header: [
          1,
          2,
          3,
          false,
        ],
      },
    ],

    [
      {
        font: [
          'urdu',
          'naskh',
          'amiri',
          'sans',
        ],
      },
    ],

    [
      {
        size: [
          '14px',
          '16px',
          '18px',
          '22px',
          '26px',
          '32px',
        ],
      },
    ],

    [
      'bold',
      'italic',
      'underline',
      'strike',
    ],

    [
      {
        color: [],
      },
      {
        background: [],
      },
    ],

    [
      {
        align: [],
      },
    ],

    [
      {
        direction: 'rtl',
      },
    ],

    [
      {
        list: 'ordered',
      },
      {
        list: 'bullet',
      },
    ],

    [
      'blockquote',
      'link',
      'image',
      'clean',
    ],
  ];


  const quill =
    new Quill(
      editorElement,
      {
        theme: 'snow',

        placeholder:
          'یہاں اپنی تحقیقی تحریر لکھیں...',

        modules: {
          toolbar: {
            container:
              toolbarOptions,

            handlers: {
              image:
                imageHandler,
            },
          },

          history: {
            delay: 800,
            maxStack: 100,
            userOnly: true,
          },
        },

        formats: [
          'header',
          'font',
          'size',
          'bold',
          'italic',
          'underline',
          'strike',
          'color',
          'background',
          'align',
          'direction',
          'list',
          'blockquote',
          'link',
          'image',
        ],
      }
    );


  /* =========================================================
     INITIAL CONTENT
     ========================================================= */

  if (initialContent.trim()) {

    quill.clipboard.dangerouslyPasteHTML(
      initialContent
    );
  }


  /* =========================================================
     FONT LABELS
     ========================================================= */

  const fontLabels = {
    urdu: 'اردو نستعلیق',
    naskh: 'Arabic Naskh',
    amiri: 'Amiri',
    sans: 'Latin',
  };

  document
    .querySelectorAll(
      '.ql-font .ql-picker-item'
    )
    .forEach((item) => {

      const value =
        item.getAttribute(
          'data-value'
        );

      if (
        value &&
        fontLabels[value]
      ) {
        item.setAttribute(
          'data-label',
          fontLabels[value]
        );
      }
    });


  const fontLabel =
    document.querySelector(
      '.ql-font .ql-picker-label'
    );

  if (fontLabel) {

    fontLabel.setAttribute(
      'data-label',
      'اردو نستعلیق'
    );
  }


  /* =========================================================
     SIZE LABELS
     ========================================================= */

  const sizeLabels = {
    '14px': '14',
    '16px': '16',
    '18px': '18',
    '22px': '22',
    '26px': '26',
    '32px': '32',
  };

  document
    .querySelectorAll(
      '.ql-size .ql-picker-item'
    )
    .forEach((item) => {

      const value =
        item.getAttribute(
          'data-value'
        );

      if (
        value &&
        sizeLabels[value]
      ) {
        item.setAttribute(
          'data-label',
          sizeLabels[value] + ' px'
        );
      }
    });


  /* =========================================================
     EDITOR DIRECTION
     ========================================================= */

  function applyLanguage() {

    const language =
      document.querySelector(
        'input[name="lang"]:checked'
      )?.value || 'ur';

    editorElement.dataset.lang =
      language;

    const root =
      quill.root;

    if (language === 'ar') {

      root.dir = 'rtl';

      root.classList.remove(
        'editor-lang-ur'
      );

      root.classList.add(
        'editor-lang-ar'
      );

    } else {

      root.dir = 'rtl';

      root.classList.remove(
        'editor-lang-ar'
      );

      root.classList.add(
        'editor-lang-ur'
      );
    }

    markDirty();
  }


  languageInputs.forEach(
    (input) => {
      input.addEventListener(
        'change',
        applyLanguage
      );
    }
  );


  applyLanguage();


  /* =========================================================
     SAVE STATE
     ========================================================= */

  let dirty = false;

  function setSaveState(
    text,
    state
  ) {

    if (saveStateText) {
      saveStateText.textContent =
        text;
    }

    if (saveState) {

      saveState.classList.remove(
        'is-ready',
        'is-dirty',
        'is-saving',
        'is-saved',
        'is-uploading'
      );

      if (state === 'dirty') {
        saveState.classList.add(
          'is-dirty'
        );
      }

      if (state === 'saving') {
        saveState.classList.add(
          'is-saving'
        );
      }

      if (state === 'saved') {
        saveState.classList.add(
          'is-saved'
        );
      }

      if (state === 'uploading') {
        saveState.classList.add(
          'is-uploading'
        );
      }

      if (state === 'ready') {
        saveState.classList.add(
          'is-ready'
        );
      }
    }
  }


  function markDirty() {

    dirty = true;

    setSaveState(
      'Unsaved changes',
      'dirty'
    );
  }


  quill.on(
    'text-change',
    (delta, oldDelta, source) => {

      if (source === 'user') {
        markDirty();
      }

      updateCounters();
    }
  );


  /* =========================================================
     COUNTERS
     ========================================================= */

  function updateCounters() {

    const text =
      quill
        .getText()
        .replace(/\s+/g, ' ')
        .trim();

    const characters =
      text.length;

    const words =
      text
        ? text.split(' ').length
        : 0;

    if (wordCount) {
      wordCount.textContent =
        `${words} words`;
    }

    if (charCount) {
      charCount.textContent =
        `${characters} characters`;
    }
  }


  updateCounters();


  if (titleInput && titleCount) {

    titleInput.addEventListener(
      'input',
      () => {

        titleCount.textContent =
          `${titleInput.value.length} / 300`;

        markDirty();
      }
    );
  }


  if (excerpt && excerptCount) {

    excerpt.addEventListener(
      'input',
      () => {

        excerptCount.textContent =
          excerpt.value.length;

        markDirty();
      }
    );
  }


  /* =========================================================
     PUBLISH STATUS
     ========================================================= */

  function updatePublishStatus() {

    if (!statusInput) return;

    const published =
      statusInput.value ===
      'published';

    if (publishStatusText) {

      publishStatusText.textContent =
        published
          ? 'Visible to readers'
          : 'Only available as a draft';
    }

    if (saveButton) {

      const span =
        saveButton.querySelector(
          'span'
        );

      if (span) {

        span.textContent =
          published
            ? 'Save & publish'
            : 'Save draft';
      }
    }
  }


  statusInput?.addEventListener(
    'change',
    () => {

      updatePublishStatus();
      markDirty();
    }
  );


  updatePublishStatus();


  /* =========================================================
     COVER IMAGE UPLOAD
     ========================================================= */

  async function uploadCover(
    file
  ) {

    if (!file) return;

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      throw new Error(
        'Please select an image.'
      );
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      throw new Error(
        'Cover image must be smaller than 5 MB.'
      );
    }

    const data =
      new FormData();

    data.append(
      '_csrf',
      csrf
    );

    data.append(
      'kind',
      'cover'
    );

    data.append(
      'image',
      file
    );

    if (coverStatus) {
      coverStatus.textContent =
        'Uploading...';
      coverStatus.className =
        'upload-status is-uploading';
    }

    const response =
      await fetch(
        `${window.ADMIN_BASE || '/admin'}/upload-image`,
        {
          method: 'POST',
          body: data,
          credentials:
            'same-origin',
        }
      );

    const result =
      await response
        .json()
        .catch(() => null);

    if (
      !response.ok ||
      !result ||
      !result.ok
    ) {
      throw new Error(
        result?.error ||
        'Cover upload failed.'
      );
    }

    if (coverUrl) {
      coverUrl.value =
        result.url;
    }

    if (coverPreview) {

      coverPreview.classList.add(
        'has-image'
      );

      coverPreview.innerHTML = '';

      const image =
        document.createElement(
          'img'
        );

      image.src =
        result.url;

      image.alt =
        'Cover preview';

      coverPreview.appendChild(
        image
      );
    }

    if (coverStatus) {

      coverStatus.textContent =
        'Cover uploaded successfully.';

      coverStatus.className =
        'upload-status is-success';
    }

    markDirty();
  }


  coverInput?.addEventListener(
    'change',
    async () => {

      const file =
        coverInput.files?.[0];

      if (!file) return;

      try {

        await uploadCover(
          file
        );

      } catch (error) {

        if (coverStatus) {

          coverStatus.textContent =
            error.message;

          coverStatus.className =
            'upload-status is-error';
        }
      }
    }
  );


  /* =========================================================
     DRAG AND DROP COVER
     ========================================================= */

  const dropzone =
    document.getElementById(
      'coverDropzone'
    );

  if (dropzone) {

    [
      'dragenter',
      'dragover',
    ].forEach(
      (eventName) => {

        dropzone.addEventListener(
          eventName,
          (event) => {

            event.preventDefault();

            dropzone.classList.add(
              'is-dragging'
            );
          }
        );
      }
    );


    [
      'dragleave',
      'drop',
    ].forEach(
      (eventName) => {

        dropzone.addEventListener(
          eventName,
          (event) => {

            event.preventDefault();

            dropzone.classList.remove(
              'is-dragging'
            );
          }
        );
      }
    );


    dropzone.addEventListener(
      'drop',
      async (event) => {

        const file =
          event.dataTransfer
            ?.files?.[0];

        if (!file) return;

        try {

          await uploadCover(
            file
          );

        } catch (error) {

          if (coverStatus) {

            coverStatus.textContent =
              error.message;

            coverStatus.className =
              'upload-status is-error';
          }
        }
      }
    );
  }


  /* =========================================================
     FORM SUBMISSION
     ========================================================= */

  form.addEventListener(
    'submit',
    () => {

      const hidden =
        document.getElementById(
          'content'
        );

      if (hidden) {

        hidden.value =
          quill.root.innerHTML;
      }

      dirty = false;

      setSaveState(
        'Saving...',
        'saving'
      );

      if (saveButton) {

        saveButton.disabled =
          true;

        saveButton.classList.add(
          'is-saving'
        );
      }
    }
  );


  /* =========================================================
     UNSAVED CHANGES WARNING
     ========================================================= */

  window.addEventListener(
    'beforeunload',
    (event) => {

      if (!dirty) return;

      event.preventDefault();
      event.returnValue = '';
    }
  );


  /* =========================================================
     KEYBOARD SHORTCUT
     ========================================================= */

  document.addEventListener(
    'keydown',
    (event) => {

      if (
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() ===
          's'
      ) {

        event.preventDefault();

        form.requestSubmit();
      }
    }
  );


  /* =========================================================
     TOOLBAR TOOLTIPS
     ========================================================= */

  const tooltips = {
    '.ql-bold':
      'Bold',
    '.ql-italic':
      'Italic',
    '.ql-underline':
      'Underline',
    '.ql-strike':
      'Strike',
    '.ql-color':
      'Text colour',
    '.ql-background':
      'Highlight colour',
    '.ql-image':
      'Upload image',
    '.ql-link':
      'Add link',
    '.ql-blockquote':
      'Quote',
    '.ql-clean':
      'Clear formatting',
    '.ql-direction':
      'RTL direction',
  };

  Object.entries(
    tooltips
  ).forEach(
    ([selector, title]) => {

      document
        .querySelectorAll(
          selector
        )
        .forEach(
          (button) => {
            button.title =
              title;
          }
        );
    }
  );

  setSaveState(
    'Ready',
    'ready'
  );

})();