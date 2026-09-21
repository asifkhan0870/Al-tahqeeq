const dateUr = new Intl.DateTimeFormat('ur-PK', { year: 'numeric', month: 'long', day: 'numeric' });
const dateEn = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

module.exports = {
  dateUr: (d) => dateUr.format(new Date(d)),
  dateEn: (d) => dateEn.format(new Date(d)),
  iso: (d) => new Date(d).toISOString(),
};
