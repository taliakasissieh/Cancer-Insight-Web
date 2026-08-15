function pdfReport(cancer, papers, treatments) {
  const d = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // =========================================================
  // COLORS
  // =========================================================

  const NAVY = [20, 61, 82];
  const TEAL = [31, 174, 174];
  const LIGHT = [239, 246, 248];
  const TEXT = [25, 54, 70];
  const MUTED = [92, 120, 136];
  const BORDER = [210, 225, 231];
  const WHITE = [255, 255, 255];
  const GREENBG = [225, 245, 239];
  const GREENTEXT = [25, 115, 88];

  const pageW = 210;
  const pageH = 297;

  const margin = 16;
  const contentW = pageW - margin * 2;

  const FOOTER_Y = 282;
  const SAFE_BOTTOM = 276;

  let pageNumber = 1;
  let y = 0;

  // =========================================================
  // TEXT HELPERS
  // =========================================================

  function decodeEntities(value) {
    if (!value) return '';

    let s = String(value);

    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = s;
      s = textarea.value;
    }

    return s
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#160;/gi, ' ')
      .replace(/&#xA0;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function safe(value) {
    return decodeEntities(
      clean(value || '')
    );
  }

  function paperTitle(p) {
    return (
      safe(
        best(
          p,
          'pubmed_title',
          'title'
        )
      ) || 'Untitled research paper'
    );
  }

  function journal(p) {
    return safe(
      best(
        p,
        'pubmed_journal',
        'journal'
      )
    );
  }

  function publicationDate(p) {
    return safe(
      best(
        p,
        'pubmed_date',
        'publicationDate'
      )
    );
  }

  function abstract(p) {
    return safe(
      best(
        p,
        'pubmed_abstract',
        'abstract'
      )
    );
  }

  function authors(p) {
    return safe(p.pubmed_authors);
  }

  function validUrl(url) {
    return (
      typeof url === 'string' &&
      /^https?:\/\//i.test(url)
    );
  }

  function shortenLines(lines, maxLines) {
    if (lines.length <= maxLines) {
      return lines;
    }

    const result = lines.slice(0, maxLines);

    const last =
      String(result[result.length - 1] || '')
        .replace(/\.*$/, '');

    result[result.length - 1] =
      last + '...';

    return result;
  }

  // =========================================================
  // PAGE HEADER / FOOTER
  // =========================================================

  function footer() {
    d.setDrawColor(...BORDER);
    d.setLineWidth(0.2);

    d.line(
      margin,
      FOOTER_Y,
      pageW - margin,
      FOOTER_Y
    );

    d.setFont('helvetica', 'normal');
    d.setFontSize(7.1);
    d.setTextColor(...MUTED);

    d.text(
      'Educational use only. Cancer Insight does not provide medical diagnosis or individualized treatment advice.',
      margin,
      287
    );

    d.text(
      `Page ${pageNumber}`,
      pageW - margin,
      287,
      {
        align: 'right'
      }
    );
  }

  function smallHeader() {
    d.setFillColor(...NAVY);

    d.rect(
      0,
      0,
      pageW,
      15,
      'F'
    );

    d.setFillColor(...TEAL);

    d.roundedRect(
      margin,
      4,
      7,
      7,
      1.5,
      1.5,
      'F'
    );

    d.setTextColor(...WHITE);
    d.setFont('helvetica', 'bold');
    d.setFontSize(9.5);

    d.text(
      '+',
      margin + 3.5,
      9.1,
      {
        align: 'center'
      }
    );

    d.setFontSize(10);

    d.text(
      'Cancer Insight',
      margin + 11,
      9.5
    );

    d.setFont('helvetica', 'normal');
    d.setFontSize(7.5);

    d.text(
      `${title(cancer)} Cancer Research Report`,
      pageW - margin,
      9.5,
      {
        align: 'right'
      }
    );
  }

  function newPage() {
    footer();

    d.addPage();

    pageNumber++;

    smallHeader();

    y = 24;
  }

  function ensureSpace(requiredHeight) {
    if (y + requiredHeight > SAFE_BOTTOM) {
      newPage();
    }
  }

  // =========================================================
  // SOURCE BUTTON
  // =========================================================

  function drawLinkButton(
    label,
    url,
    x,
    buttonY,
    width,
    mode = 'teal'
  ) {
    if (!validUrl(url)) {
      return;
    }

    if (mode === 'green') {
      d.setFillColor(...GREENBG);
      d.setDrawColor(190, 226, 214);
      d.setTextColor(...GREENTEXT);
    } else if (mode === 'navy') {
      d.setFillColor(231, 239, 244);
      d.setDrawColor(...BORDER);
      d.setTextColor(...NAVY);
    } else {
      d.setFillColor(226, 246, 247);
      d.setDrawColor(187, 226, 228);
      d.setTextColor(18, 126, 132);
    }

    d.roundedRect(
      x,
      buttonY,
      width,
      7,
      1.5,
      1.5,
      'FD'
    );

    d.setFont('helvetica', 'bold');
    d.setFontSize(7);

    d.textWithLink(
      label,
      x + width / 2,
      buttonY + 4.6,
      {
        url,
        align: 'center'
      }
    );
  }

  // =========================================================
  // COVER HEADER
  // =========================================================

  d.setFillColor(...NAVY);

  d.rect(
    0,
    0,
    pageW,
    54,
    'F'
  );

  d.setFillColor(...TEAL);

  d.roundedRect(
    margin,
    12,
    13,
    13,
    2.5,
    2.5,
    'F'
  );

  d.setTextColor(...WHITE);
  d.setFont('helvetica', 'bold');
  d.setFontSize(17);

  d.text(
    '+',
    margin + 6.5,
    21.3,
    {
      align: 'center'
    }
  );

  d.setFontSize(18);

  d.text(
    'Cancer Insight',
    margin + 18,
    20
  );

  d.setFont('helvetica', 'normal');
  d.setFontSize(8.5);

  d.text(
    'Evidence-first cancer research explorer',
    margin + 18,
    26
  );

  d.setFont('helvetica', 'bold');
  d.setFontSize(22);

  d.text(
    'Research Report',
    margin,
    43
  );

  y = 67;

  // =========================================================
  // CANCER TITLE
  // =========================================================

  d.setTextColor(...TEXT);
  d.setFont('helvetica', 'bold');
  d.setFontSize(24);

  d.text(
    `${title(cancer)} Cancer`,
    margin,
    y
  );

  y += 8;

  d.setFont('helvetica', 'normal');
  d.setFontSize(10);
  d.setTextColor(...MUTED);

  d.text(
    'Research literature overview generated by Cancer Insight',
    margin,
    y
  );

  y += 13;

  // =========================================================
  // SUMMARY VALUES
  // =========================================================

  const freeCount =
    papers.filter(p => p.pmc_id).length;

  const years = papers
    .map(p => {
      const match = String(
        best(
          p,
          'pubmed_date',
          'publicationDate'
        ) || ''
      ).match(/\b(19|20)\d{2}\b/);

      return match
        ? Number(match[0])
        : null;
    })
    .filter(Boolean);

  const latestYear =
    years.length
      ? Math.max(...years)
      : '—';

  const cards = [
    ['Research Papers', papers.length],
    ['Free Full Text', freeCount],
    ['Latest Year', latestYear],
    [
      'Treatment Types',
      treatments?.length || 0
    ]
  ];

  const gap = 4;

  const cardW =
    (contentW - gap * 3) / 4;

  cards.forEach(
    ([label, value], i) => {
      const x =
        margin +
        i * (cardW + gap);

      d.setFillColor(...LIGHT);
      d.setDrawColor(...BORDER);

      d.roundedRect(
        x,
        y,
        cardW,
        25,
        2.5,
        2.5,
        'FD'
      );

      d.setTextColor(...MUTED);
      d.setFont('helvetica', 'normal');
      d.setFontSize(7.5);

      d.text(
        label,
        x + 4,
        y + 7
      );

      d.setTextColor(...NAVY);
      d.setFont('helvetica', 'bold');
      d.setFontSize(16);

      d.text(
        String(value),
        x + 4,
        y + 18
      );
    }
  );

  y += 35;

  // =========================================================
  // OVERVIEW
  // =========================================================

  d.setTextColor(...NAVY);
  d.setFont('helvetica', 'bold');
  d.setFontSize(15);

  d.text(
    'Research Overview',
    margin,
    y
  );

  y += 7;

  d.setTextColor(...TEXT);
  d.setFont('helvetica', 'normal');
  d.setFontSize(9);

  const intro =
    `This report summarizes ${papers.length} research papers retrieved for ` +
    `${title(cancer)} cancer. Cancer Insight presents publication metadata, ` +
    `abstracts, treatment research coverage, and links to original scientific sources. ` +
    `The report describes retrieved research literature and does not rank treatments ` +
    `or provide medical recommendations.`;

  const introLines =
    d.splitTextToSize(
      intro,
      contentW
    );

  d.text(
    introLines,
    margin,
    y
  );

  y +=
    introLines.length * 4.5 +
    9;

  // =========================================================
  // TREATMENT COVERAGE
  // =========================================================

  if (
    treatments &&
    treatments.length
  ) {
    d.setTextColor(...NAVY);
    d.setFont('helvetica', 'bold');
    d.setFontSize(15);

    d.text(
      'Treatment Research Coverage',
      margin,
      y
    );

    y += 8;

    const treatmentList =
      treatments.slice(0, 8);

    const max = Math.max(
      1,
      ...treatmentList.map(
        x => Number(x[1]) || 0
      )
    );

    treatmentList.forEach(
      ([name, count]) => {
        ensureSpace(9);

        d.setTextColor(...TEXT);
        d.setFont('helvetica', 'normal');
        d.setFontSize(8.5);

        d.text(
          title(name).slice(0, 36),
          margin,
          y + 3
        );

        const barX =
          margin + 60;

        const barW = 90;

        d.setFillColor(
          224,
          235,
          239
        );

        d.roundedRect(
          barX,
          y,
          barW,
          4,
          1,
          1,
          'F'
        );

        d.setFillColor(...TEAL);

        const fill =
          Math.max(
            3,
            (Number(count) / max) * barW
          );

        d.roundedRect(
          barX,
          y,
          fill,
          4,
          1,
          1,
          'F'
        );

        d.setFont('helvetica', 'bold');
        d.setTextColor(...NAVY);

        d.text(
          String(count),
          pageW - margin,
          y + 3,
          {
            align: 'right'
          }
        );

        y += 8;
      }
    );
  }

  // =========================================================
  // FORCE RESEARCH PAPERS TO START ON PAGE 2
  // =========================================================

  footer();

  d.addPage();

  pageNumber++;

  smallHeader();

  y = 27;

  d.setTextColor(...NAVY);
  d.setFont('helvetica', 'bold');
  d.setFontSize(17);

  d.text(
    'Research Papers',
    margin,
    y
  );

  y += 5;

  d.setDrawColor(...TEAL);
  d.setLineWidth(0.8);

  d.line(
    margin,
    y,
    margin + 35,
    y
  );

  y += 10;

  // =========================================================
  // RESEARCH PAPER CARDS
  // =========================================================

  papers
    .slice(0, 20)
    .forEach((p, i) => {
      const t =
        paperTitle(p);

      const j =
        journal(p);

      const dt =
        publicationDate(p);

      const auth =
        authors(p);

      const abs =
        abstract(p);

      const titleLines =
        d.splitTextToSize(
          t,
          contentW - 20
        );

      const metaText =
        [j, dt, auth]
          .filter(Boolean)
          .join(' | ');

      const metaLines =
        metaText
          ? d.splitTextToSize(
              metaText,
              contentW - 20
            )
          : [];

      const allAbstractLines =
        abs
          ? d.splitTextToSize(
              abs,
              contentW - 20
            )
          : [];

      // Maximum abstract shown in each PDF card.
      // This prevents giant cards and guarantees no overflow.
      const abstractLines =
        shortenLines(
          allAbstractLines,
          10
        );

      const treatmentText =
        arr(p.treatmentTypes).length
          ? `Treatments mentioned: ${arr(
              p.treatmentTypes
            )
              .map(title)
              .join(', ')}`
          : '';

      const allTreatmentLines =
        treatmentText
          ? d.splitTextToSize(
              treatmentText,
              contentW - 20
            )
          : [];

      const treatmentLines =
        shortenLines(
          allTreatmentLines,
          2
        );

      const hasPubMed =
        validUrl(p.pubmed_url);

      const hasPMC =
        validUrl(p.pmc_url);

      const hasPublisher =
        validUrl(p.publisher_url);

      const hasLinks =
        hasPubMed ||
        hasPMC ||
        hasPublisher;

      // -------------------------------------------------------
      // DYNAMIC HEIGHT
      // -------------------------------------------------------

      const topPadding = 7;
      const bottomPadding = 6;

      const titleHeight =
        titleLines.length * 5;

      const metaHeight =
        metaLines.length
          ? metaLines.length * 3.6 + 3
          : 0;

      const badgeHeight =
        p.pmc_id
          ? 8
          : 0;

      const abstractHeight =
        abstractLines.length
          ? abstractLines.length * 4 + 3
          : 0;

      const treatmentHeight =
        treatmentLines.length
          ? treatmentLines.length * 3.7 + 3
          : 0;

      const linkHeight =
        hasLinks
          ? 11
          : 0;

      const cardHeight =
        topPadding +
        titleHeight +
        metaHeight +
        badgeHeight +
        abstractHeight +
        treatmentHeight +
        linkHeight +
        bottomPadding;

      // Whole card moves to next page if it will not fit.
      ensureSpace(
        cardHeight + 7
      );

      const startY = y;

      // -------------------------------------------------------
      // CARD BACKGROUND
      // -------------------------------------------------------

      d.setFillColor(
        250,
        252,
        253
      );

      d.setDrawColor(...BORDER);

      d.roundedRect(
        margin,
        startY,
        contentW,
        cardHeight,
        2.5,
        2.5,
        'FD'
      );

      // -------------------------------------------------------
      // PAPER NUMBER
      // -------------------------------------------------------

      d.setFillColor(...TEAL);

      d.roundedRect(
        margin + 4,
        startY + 5,
        8,
        8,
        1.5,
        1.5,
        'F'
      );

      d.setTextColor(...WHITE);
      d.setFont('helvetica', 'bold');

      d.setFontSize(
        i + 1 >= 10
          ? 6.2
          : 7.2
      );

      d.text(
        String(i + 1),
        margin + 8,
        startY + 10.2,
        {
          align: 'center'
        }
      );

      let py =
        startY + 9.5;

      // -------------------------------------------------------
      // TITLE
      // -------------------------------------------------------

      d.setTextColor(...NAVY);
      d.setFont('helvetica', 'bold');
      d.setFontSize(10);

      d.text(
        titleLines,
        margin + 16,
        py
      );

      py +=
        titleHeight + 2;

      // -------------------------------------------------------
      // METADATA
      // -------------------------------------------------------

      if (metaLines.length) {
        d.setTextColor(...MUTED);
        d.setFont('helvetica', 'normal');
        d.setFontSize(7.4);

        d.text(
          metaLines,
          margin + 16,
          py
        );

        py +=
          metaLines.length * 3.6 +
          3;
      }

      // -------------------------------------------------------
      // FREE FULL TEXT BADGE
      // -------------------------------------------------------

      if (p.pmc_id) {
        d.setFillColor(...GREENBG);
        d.setTextColor(...GREENTEXT);

        d.roundedRect(
          margin + 16,
          py - 2,
          31,
          5.8,
          1.5,
          1.5,
          'F'
        );

        d.setFont('helvetica', 'bold');
        d.setFontSize(6.4);

        d.text(
          'FREE FULL TEXT',
          margin + 19,
          py + 1.8
        );

        py += 8;
      }

      // -------------------------------------------------------
      // ABSTRACT
      // -------------------------------------------------------

      if (abstractLines.length) {
        d.setTextColor(...TEXT);
        d.setFont('helvetica', 'normal');
        d.setFontSize(8);

        d.text(
          abstractLines,
          margin + 16,
          py
        );

        py +=
          abstractLines.length * 4 +
          3;
      }

      // -------------------------------------------------------
      // TREATMENTS
      // -------------------------------------------------------

      if (treatmentLines.length) {
        d.setTextColor(...TEAL);
        d.setFont('helvetica', 'bold');
        d.setFontSize(7);

        d.text(
          treatmentLines,
          margin + 16,
          py
        );

        py +=
          treatmentLines.length * 3.7 +
          3;
      }

      // -------------------------------------------------------
      // LINKS
      // -------------------------------------------------------

      if (hasLinks) {
        const buttonY =
          startY +
          cardHeight -
          10;

        let buttonX =
          margin + 16;

        if (hasPubMed) {
          drawLinkButton(
            'PubMed',
            p.pubmed_url,
            buttonX,
            buttonY,
            25,
            'navy'
          );

          buttonX += 29;
        }

        if (hasPMC) {
          drawLinkButton(
            'Free Full Text',
            p.pmc_url,
            buttonX,
            buttonY,
            35,
            'green'
          );

          buttonX += 39;
        }

        if (hasPublisher) {
          drawLinkButton(
            'Publisher',
            p.publisher_url,
            buttonX,
            buttonY,
            29,
            'teal'
          );
        }
      }

      y =
        startY +
        cardHeight +
        6;
    });

  // =========================================================
  // SOURCES & INTERPRETATION
  // =========================================================

  ensureSpace(42);

  d.setFillColor(...LIGHT);
  d.setDrawColor(...BORDER);

  d.roundedRect(
    margin,
    y,
    contentW,
    33,
    2.5,
    2.5,
    'FD'
  );

  d.setTextColor(...NAVY);
  d.setFont('helvetica', 'bold');
  d.setFontSize(10);

  d.text(
    'Sources & Interpretation',
    margin + 6,
    y + 8
  );

  d.setTextColor(...TEXT);
  d.setFont('helvetica', 'normal');
  d.setFontSize(7.8);

  const sourceText =
    'Cancer Insight keeps original research sources visible whenever available, ' +
    'including PubMed, PubMed Central (PMC), DOI, and publisher links. ' +
    'Paper counts and treatment coverage describe the retrieved literature only ' +
    'and should not be interpreted as evidence that one treatment is superior.';

  d.text(
    d.splitTextToSize(
      sourceText,
      contentW - 12
    ),
    margin + 6,
    y + 14
  );

  footer();

  // =========================================================
  // PDF METADATA
  // =========================================================

  d.setProperties({
    title:
      `Cancer Insight - ${title(cancer)} Cancer Research Report`,

    subject:
      `${title(cancer)} cancer research literature`,

    author:
      'Cancer Insight',

    creator:
      'Cancer Insight'
  });

  d.save(
    `cancer_insight_${String(cancer)
      .replace(/\s+/g, '_')
      .toLowerCase()}_research_report.pdf`
  );
}
