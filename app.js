/* Public content is maintained in data.js. */
(() => {
  'use strict';
  const profile = window.PROFILE || {};
  const publications = Array.isArray(profile.publications) ? [...profile.publications].sort((a, b) => Number(b.year) - Number(a.year)) : [];
  const byId = id => document.getElementById(id);
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };
  const safeUrl = value => {
    if (!value) return null;
    try { const url = new URL(String(value)); return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null; } catch (_) { return null; }
  };
  const externalLink = (label, url, className = '') => {
    const href = safeUrl(url);
    if (!href) return null;
    const anchor = make('a', className, label);
    anchor.href = href;
    if (!href.startsWith('mailto:')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
    return anchor;
  };
  const applyLink = (id, url) => {
    const href = safeUrl(url);
    const anchor = byId(id);
    if (href) anchor.href = href;
    else anchor.hidden = true;
  };
  const name = profile.name || 'Hyeonseung Shin';
  document.title = `${name} — Research`;
  byId('footer-name').textContent = name;
  byId('copyright-year').textContent = String(new Date().getFullYear());
  if (name !== 'Hyeonseung Shin') {
    byId('hero-name').replaceChildren(document.createTextNode(name), make('span', 'name-dot', '.'));
    document.querySelector('.wordmark').setAttribute('aria-label', `${name} home`);
    const wordmarkText = document.querySelector('.wordmark > span:last-child');
    wordmarkText.replaceChildren(document.createTextNode(name), make('span', 'wordmark-sub', 'Research portfolio'));
  }
  byId('hero-affiliation').textContent = profile.affiliation || 'Research portfolio';
  if (profile.role) { byId('hero-role').textContent = profile.role; byId('hero-role').hidden = false; }
  if (profile.intro) byId('hero-intro').textContent = profile.intro;
  const bio = Array.isArray(profile.bio) ? profile.bio : profile.bio ? [profile.bio] : [];
  bio.forEach(paragraph => byId('bio').append(make('p', '', paragraph)));
  (profile.researchTags || []).forEach(tag => byId('research-tags').append(make('li', '', tag)));
  const counts = ['Journal', 'Conference', 'Preprint'].map(type => ({ type, count: publications.filter(paper => paper.type === type).length }));
  counts.filter(item => item.count > 0).forEach(item => {
    const stat = make('div', 'stat');
    stat.append(make('span', 'stat-number', String(item.count).padStart(2, '0')), make('span', 'stat-label', `${item.type === 'Journal' ? 'Journal article' : item.type === 'Conference' ? 'Conference paper' : 'Preprint'}${item.count === 1 ? '' : 's'}`));
    byId('research-stats').append(stat);
  });
  applyLink('hero-orcid', profile.orcidUrl);
  applyLink('publications-orcid', profile.orcidUrl);
  const normalizeAuthor = author => String(author).toLowerCase().replace(/[^a-z]/g, '');
  const ownerAuthor = normalizeAuthor(name);
  const renderAuthors = authors => {
    const line = make('p', 'publication-authors');
    const authorList = Array.isArray(authors) ? authors : String(authors || '').split(/;\s*/);
    authorList.filter(Boolean).forEach((author, index) => {
      if (index) line.append(document.createTextNode(', '));
      if (normalizeAuthor(author) === ownerAuthor) line.append(make('strong', '', author));
      else line.append(document.createTextNode(author));
    });
    return line;
  };
  const doiUrl = doi => {
    if (!doi) return null;
    return safeUrl(String(doi).startsWith('https://') ? doi : `https://doi.org/${String(doi).replace(/^doi:\s*/i, '')}`);
  };
  const renderPaper = paper => {
    const article = make('article', 'publication');
    const meta = make('div', 'publication-meta');
    meta.append(make('span', `publication-type ${paper.type === 'Preprint' ? 'preprint' : ''}`, paper.type || 'Publication'));
    if (paper.venue) meta.append(make('span', '', paper.venue));
    article.append(meta);
    const heading = make('h3', 'publication-title');
    const primaryUrl = safeUrl(paper.url) || doiUrl(paper.doi) || safeUrl(paper.pdf);
    const titleLink = externalLink(paper.title, primaryUrl);
    heading.append(titleLink || document.createTextNode(paper.title || 'Untitled work'));
    article.append(heading, renderAuthors(paper.authors));
    if (paper.summary) article.append(make('p', 'publication-summary', paper.summary));
    const links = make('div', 'publication-links');
    const choices = [['DOI', doiUrl(paper.doi)], ['Publication', safeUrl(paper.url)], ['PDF', safeUrl(paper.pdf)]];
    const linked = new Set();
    choices.forEach(([label, url]) => {
      if (!url || linked.has(url)) return;
      linked.add(url);
      const link = externalLink(label, url);
      const arrow = make('span', '', '↗');
      arrow.setAttribute('aria-hidden', 'true');
      link.append(arrow); links.append(link);
    });
    if (links.childElementCount) article.append(links);
    return article;
  };
  const filters = [{ type: 'All', count: publications.length }, ...counts];
  let currentFilter = 'All';
  const renderPublications = () => {
    const shown = publications.filter(paper => currentFilter === 'All' || paper.type === currentFilter);
    const list = byId('publication-list'); list.replaceChildren();
    if (!shown.length) list.append(make('p', 'empty-state', 'No publications in this category.'));
    let currentYear, group;
    shown.forEach(paper => {
      if (String(paper.year) !== currentYear) {
        currentYear = String(paper.year);
        const section = make('div', 'publication-year');
        section.append(make('h3', 'year-heading', paper.year));
        group = make('div', 'year-papers'); section.append(group); list.append(section);
      }
      group.append(renderPaper(paper));
    });
    byId('filter-status').textContent = `Showing ${shown.length} ${currentFilter === 'All' ? '' : currentFilter.toLowerCase() + ' '}publication${shown.length === 1 ? '' : 's'}.`;
    document.querySelectorAll('.filter-button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === currentFilter)));
  };
  filters.forEach(({ type, count }) => {
    const button = make('button', 'filter-button'); button.type = 'button'; button.dataset.filter = type;
    button.setAttribute('aria-pressed', String(type === currentFilter));
    button.append(document.createTextNode(type === 'All' ? 'All works' : type), make('span', 'filter-count', count));
    button.addEventListener('click', () => { currentFilter = type; renderPublications(); });
    byId('publication-filters').append(button);
  });
  renderPublications();
  (profile.experience || []).forEach(item => {
    const row = make('div', 'experience-item'); row.append(make('p', 'experience-period', item.period));
    const body = make('div', 'experience-body'); body.append(make('h3', 'experience-institution', item.institution));
    if (item.role) body.append(make('p', 'experience-role', item.role));
    if (item.detail) body.append(make('p', 'experience-detail', item.detail));
    row.append(body); byId('experience-list').append(row);
  });
  if (profile.email) {
    const email = byId('contact-email'); email.textContent = profile.email;
    email.href = `mailto:${String(profile.email).trim()}`; email.hidden = false;
  }
  [['ORCID', profile.orcidUrl], ['GitHub', profile.githubUrl]].forEach(([label, url]) => {
    const link = externalLink(label, url); if (!link) return;
    const arrow = make('span', '', '↗'); arrow.setAttribute('aria-hidden', 'true'); link.append(arrow);
    byId('profile-links').append(link);
  });
  const siteUrl = safeUrl(profile.siteUrl);
  if (siteUrl) {
    byId('site-address').href = siteUrl;
    byId('site-address').textContent = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const canonical = make('link'); canonical.rel = 'canonical'; canonical.href = siteUrl; document.head.append(canonical);
  } else byId('site-address').hidden = true;
  if (profile.qrStatus === 'provisional') {
    byId('qr-caption').textContent = 'Preview QR for the planned homepage address. The site is awaiting publication.';
    byId('qr-image').alt = 'Preview QR code pointing to the planned homepage address';
  }
  if (profile.updated) byId('updated-label').textContent = `Updated ${profile.updated}`;
  document.querySelector('meta[name="description"]').content = `${name}${profile.affiliation ? ' · ' + profile.affiliation : ''}. Research, publications, and academic activities.`;
})();
