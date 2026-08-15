'use client';
import {useEffect,useMemo,useState} from 'react'; import {jsPDF} from 'jspdf';
const pages=['Search','Research Papers','Research Analytics','Treatment Research','Compare Treatments','Cancer Images','About'];
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); const title=s=>String(s||'').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()); const norm=s=>String(s||'').trim().toLowerCase().replace(/[_-]/g,' ').replace(/\s+/g,' '); const arr=x=>Array.isArray(x)?x:x?[x]:[];
function best(p,k1,k2){return p[k1]||p[k2]||''} function key(p){return p.pubmedId||p.doi||best(p,'pubmed_title','title')}
function Paper({p,n,saved,toggle}){const t=best(p,'pubmed_title','title')||'Untitled research paper',a=best(p,'pubmed_abstract','abstract'),j=best(p,'pubmed_journal','journal'),d=best(p,'pubmed_date','publicationDate');return <div className={'paper '+(saved?'saved':'')}><div className="muted">{n?`Paper ${n}`:'Research paper'}</div><h3>{t}</h3><div className="muted">{[j,d,p.pubmed_authors].filter(Boolean).join(' · ')}</div><div>{p.pmc_id&&<span className="badge free">Free full text in PMC</span>}{a&&<span className="badge abstract">PubMed abstract</span>}{(p.pmc_url||p.publisher_url)&&<span className="badge link">Full-text source link</span>}</div>{a&&<p>{clean(a)}</p>}{arr(p.treatmentTypes).length>0&&<p><b>Treatments mentioned in evidence:</b> {arr(p.treatmentTypes).map(title).join(', ')}</p>}<div className="paperlinks">{p.pubmed_url&&<a href={p.pubmed_url} target="_blank">PubMed</a>}{p.pmc_url&&<a href={p.pmc_url} target="_blank">Free full text</a>}{p.publisher_url&&<a href={p.publisher_url} target="_blank">Publisher</a>}<button onClick={()=>toggle(key(p))}>{saved?'★ Saved':'☆ Save paper'}</button></div></div>}
function Metrics({p,tcount}){const vals=[['Research papers',p.paper_count],['Free full text',p.free_full_text_count],['Latest year',p.latest_year||'—'],['Journals',p.journals?.length||0],['Clinical trials',p.clinical_trials||0],['Treatment types',tcount??'—']];return <div className="grid6">{vals.map(([a,b])=><div className="metric" key={a}><span className="muted">{a}</span><div className="num">{b}</div></div>)}</div>}
function Bars({items}){const max=Math.max(1,...items.map(x=>x[1]));return <div className="panel">{items.map(([k,v])=><div className="barrow" key={k}><div className="barlabel">{title(k)}</div><div className="bar" style={{width:`${Math.max(3,v/max*70)}%`}}></div><b>{v}</b></div>)}</div>}
export default function App(){const [page,setPage]=useState('Search'),[input,setInput]=useState(''),[data,setData]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[bookmarks,setBookmarks]=useState([]),[images,setImages]=useState([]);useEffect(()=>{try{setBookmarks(JSON.parse(localStorage.getItem('ci-bookmarks')||'[]'))}catch{}},[]);const toggle=k=>setBookmarks(b=>{const n=b.includes(k)?b.filter(x=>x!==k):[...b,k];localStorage.setItem('ci-bookmarks',JSON.stringify(n));return n});async function search(e){e.preventDefault();setError('');setNotice('');setData(null);setImages([]);const q=input.trim();if(!q){setError('Enter a cancer type to search.');return}setBusy(true);try{const r=await fetch('/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cancer:q.toLowerCase()})});const j=await r.json();if(!r.ok)throw Error(j.error);setData(j);setNotice(`Found ${j.papers.length} papers for ${title(q)}.`)}catch(e){setError(e.message)}finally{setBusy(false)}}return <div className="app"><aside className="sidebar"><div className="brand"><div className="brandrow"><div className="mark">✚</div><strong>Cancer Insight</strong></div><small>Evidence-first cancer research explorer</small></div><div className="nav">{pages.map(p=><button className={page===p?'active':''} onClick={()=>{setPage(p);scrollTo(0,0)}} key={p}>● &nbsp; {p}</button>)}</div>{data&&<div className="sideinfo"><b>{title(data.cancer)} cancer</b><br/>{data.profile.paper_count} papers · {data.treatments.length} treatment types<br/>{data.profile.free_full_text_count} free full-text in PMC</div>}<div className="sideinfo">Educational use only. Not medical advice.</div></aside><main className="main"><div className="content">{page==='Search'&&<Search input={input} setInput={setInput} search={search} data={data} error={error} notice={notice} busy={busy}/>} {page==='Research Papers'&&<Research data={data} bookmarks={bookmarks} toggle={toggle}/>} {page==='Research Analytics'&&<Analytics data={data}/>} {page==='Treatment Research'&&<Treatment data={data} bookmarks={bookmarks} toggle={toggle}/>} {page==='Compare Treatments'&&<Compare data={data}/>} {page==='Cancer Images'&&<Images data={data} images={images} setImages={setImages}/>} {page==='About'&&<About/>}<div className="disclaimer"><b>Educational use only.</b> Cancer Insight does not provide medical diagnosis, individualized treatment recommendations, or professional medical advice.</div></div></main></div>}
function Need(){return <div className="panel">Search for a cancer type first to view this section.</div>}
function Search({input,setInput,search,data,error,notice,busy}){return <><section className="hero"><div className="eyebrow">Evidence-first cancer research platform</div><h1>Cancer Insight</h1><p>Search cancer research, read PubMed abstracts, identify free full-text papers, explore treatment evidence, and compare research coverage without hiding the original sources.</p></section>{error&&<div className="error">{error}</div>}{notice&&<div className="success">{notice}</div>}<form className="panel" onSubmit={search}><label>Cancer type<input value={input} onChange={e=>setInput(e.target.value)} placeholder="For example: lung"/></label><br/><button className="primary" disabled={busy}>{busy?'Searching and enriching papers with PubMed metadata…':'Search research'}</button></form>{data&&<><h2>Research Highlights</h2><Metrics p={data.profile} tcount={data.treatments.length}/><h3>Treatment research coverage</h3><Bars items={data.treatments}/></>}</>}
function Research({data,bookmarks,toggle}){const [q,setQ]=useState(''),[access,setAccess]=useState('All'),[tr,setTr]=useState('All treatments'),[year,setYear]=useState('All years'),[sort,setSort]=useState('Original relevance'),[saved,setSaved]=useState(false);const papers=useMemo(()=>{if(!data)return[];let x=[...data.papers];if(q)x=x.filter(p=>[best(p,'pubmed_title','title'),best(p,'pubmed_abstract','abstract'),best(p,'pubmed_journal','journal'),p.mesh_terms].join(' ').toLowerCase().includes(q.toLowerCase()));if(access==='Free full text in PMC')x=x.filter(p=>p.pmc_id);if(access==='Has abstract')x=x.filter(p=>best(p,'pubmed_abstract','abstract'));if(access==='Has full-text link')x=x.filter(p=>p.pmc_url||p.publisher_url);if(tr!=='All treatments')x=x.filter(p=>arr(p.treatmentTypes).map(norm).includes(norm(tr)));if(year!=='All years')x=x.filter(p=>String(best(p,'pubmed_date','publicationDate')).includes(year));if(saved)x=x.filter(p=>bookmarks.includes(key(p)));if(sort==='Newest first')x.sort((a,b)=>String(best(b,'pubmed_date','publicationDate')).localeCompare(String(best(a,'pubmed_date','publicationDate'))));if(sort==='Free full text first')x.sort((a,b)=>Number(!!b.pmc_id)-Number(!!a.pmc_id));return x},[data,q,access,tr,year,sort,saved,bookmarks]);if(!data)return <><h1>Research Papers</h1><Need/></>;const years=[...new Set(data.papers.map(p=>(String(best(p,'pubmed_date','publicationDate')).match(/\b(19|20)\d{2}\b/)||[])[0]).filter(Boolean))].sort().reverse();function csv(){const cols=['pubmedId','pubmed_title','pubmed_journal','pubmed_date','pubmed_authors','publication_types','treatmentTypes','pubmed_url','pmc_url','doi','pubmed_abstract'];const esc=v=>'"'+String(Array.isArray(v)?v.join('; '):v??'').replaceAll('"','""')+'"';download('cancer_insight_'+data.cancer.replaceAll(' ','_')+'_papers.csv',[cols.join(','),...papers.map(p=>cols.map(c=>esc(p[c])).join(','))].join('\n'),'text/csv')}return <><h1>Research Papers</h1><p className="muted">{title(data.cancer)} · enriched with PubMed metadata when a PMID is available</p><div className="filters"><label>Search titles, abstracts, journals, or MeSH terms<input value={q} onChange={e=>setQ(e.target.value)}/></label><label>Access<select value={access} onChange={e=>setAccess(e.target.value)}>{['All','Free full text in PMC','Has abstract','Has full-text link'].map(x=><option>{x}</option>)}</select></label><label>Treatment<select value={tr} onChange={e=>setTr(e.target.value)}>{['All treatments',...data.treatments.map(x=>x[0])].map(x=><option>{x}</option>)}</select></label></div><div className="filters three"><label>Year<select value={year} onChange={e=>setYear(e.target.value)}>{['All years',...years].map(x=><option>{x}</option>)}</select></label><label>Sort by<select value={sort} onChange={e=>setSort(e.target.value)}>{['Original relevance','Newest first','Free full text first'].map(x=><option>{x}</option>)}</select></label><label><br/><input type="checkbox" checked={saved} onChange={e=>setSaved(e.target.checked)}/> Show saved papers only</label></div><div className="toolbar"><button onClick={()=>pdfReport(data.cancer,papers,data.treatments)}>Download PDF Research Report</button><button onClick={csv}>Export Raw Data (CSV)</button></div><p>Showing <b>{papers.length}</b> papers</p>{papers.map((p,i)=><Paper p={p} n={i+1} saved={bookmarks.includes(key(p))} toggle={toggle} key={key(p)+i}/>)}</>}
function Analytics({data}){if(!data)return <><h1>Research Analytics</h1><Need/></>;return <><h1>Research Analytics</h1><Metrics p={data.profile} tcount={data.treatments.length}/><h3>Treatment coverage</h3><Bars items={data.treatments}/><h3>Publication timeline</h3><Bars items={Object.entries(data.profile.year_counts||{}).sort()}/><h3>Top journals</h3><Bars items={data.profile.top_journals||[]}/><div className="toolbar"><button onClick={()=>pdfReport(data.cancer,data.papers,data.treatments)}>Download PDF Research Report</button><button onClick={()=>download(data.cancer.replaceAll(' ','_')+'_treatment_counts.csv','treatment,paper_count\n'+data.treatments.map(x=>x.join(',')).join('\n'),'text/csv')}>Export Treatment Counts (CSV)</button></div></>}
function Treatment({data,bookmarks,toggle}){const [tr,setTr]=useState(''),[evidence,setEvidence]=useState([]),[busy,setBusy]=useState(false);useEffect(()=>{if(data?.treatments?.length&&!tr)setTr(data.treatments[0][0])},[data,tr]);useEffect(()=>{if(!data||!tr)return;setBusy(true);fetch('/api/treatment',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cancer:data.cancer,treatment:tr,limit:14})}).then(r=>r.json()).then(j=>setEvidence(j.papers||[])).finally(()=>setBusy(false))},[data,tr]);if(!data)return <><h1>Treatment Research</h1><Need/></>;const api=data.papers.filter(p=>arr(p.treatmentTypes).map(norm).includes(norm(tr)));return <><h1>Treatment Research</h1><label>Choose a treatment<select value={tr} onChange={e=>setTr(e.target.value)}>{data.treatments.map(x=><option value={x[0]}>{title(x[0])}</option>)}</select></label><div className="panel"><h2>{title(tr)}</h2><p>Evidence-focused research view for {title(data.cancer)} cancer. Statements below are based on retrieved PubMed-indexed papers; paper counts do not indicate medical superiority.</p></div><h2>Research Highlights</h2><Metrics p={simpleProfile([...api,...evidence])}/>{busy&&<p>Retrieving treatment-focused PubMed evidence…</p>}<h2>Papers in your Cancer Insight search</h2>{api.length?api.map((p,i)=><Paper p={p} n={i+1} saved={bookmarks.includes(key(p))} toggle={toggle}/>):<div className="panel">No API-tagged papers for this treatment were returned in the current search.</div>}<h2>Additional PubMed evidence</h2>{evidence.slice(0,8).map((p,i)=><Paper p={p} n={i+1} saved={bookmarks.includes(key(p))} toggle={toggle}/>)}</>}
function Compare({data}){const [a,setA]=useState(''),[b,setB]=useState(''),[ea,setEa]=useState([]),[eb,setEb]=useState([]);useEffect(()=>{if(data?.treatments?.length){setA(x=>x||data.treatments[0]?.[0]||'');setB(x=>x||data.treatments[1]?.[0]||'')}},[data]);useEffect(()=>{if(!data||!a||!b||a===b)return;Promise.all([a,b].map(t=>fetch('/api/treatment',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cancer:data.cancer,treatment:t,limit:12})}).then(r=>r.json()))).then(([x,y])=>{setEa(x.papers||[]);setEb(y.papers||[])})},[data,a,b]);if(!data)return <><h1>Compare Treatments</h1><Need/></>;if(data.treatments.length<2)return <div className="panel">At least two treatment types are needed for comparison.</div>;const pa=simpleProfile([...data.papers.filter(p=>arr(p.treatmentTypes).map(norm).includes(norm(a))),...ea]),pb=simpleProfile([...data.papers.filter(p=>arr(p.treatmentTypes).map(norm).includes(norm(b))),...eb]);return <><h1>Compare Treatments</h1><div className="compare"><label>First treatment<select value={a} onChange={e=>setA(e.target.value)}>{data.treatments.map(x=><option value={x[0]}>{title(x[0])}</option>)}</select></label><label>Second treatment<select value={b} onChange={e=>setB(e.target.value)}>{data.treatments.map(x=><option value={x[0]}>{title(x[0])}</option>)}</select></label></div>{a===b?<div className="error">Choose two different treatments.</div>:<><div className="panel"><b>How to read this comparison:</b> the descriptions explain each treatment, while the numbers compare the retrieved research evidence. More papers or newer studies do not mean one treatment is medically better.</div><h2>Research Comparison</h2><table className="table"><thead><tr><th>Measure</th><th>{title(a)}</th><th>{title(b)}</th></tr></thead><tbody>{[['Unique evidence papers','paper_count'],['Free full text in PMC','free_full_text_count'],['Latest year','latest_year'],['Journals represented','journal_count'],['Clinical trials','clinical_trials'],['Reviews','reviews'],['Meta-analyses','meta_analyses']].map(([l,k])=><tr><td>{l}</td><td>{pa[k]||'—'}</td><td>{pb[k]||'—'}</td></tr>)}</tbody></table><div className="compare"><div><h3>{title(a)} — strongest supporting PubMed evidence</h3>{ea.slice(0,3).map((p,i)=><Paper p={p} n={i+1} saved={false} toggle={()=>{}}/>)}</div><div><h3>{title(b)} — strongest supporting PubMed evidence</h3>{eb.slice(0,3).map((p,i)=><Paper p={p} n={i+1} saved={false} toggle={()=>{}}/>)}</div></div></>}</>}
function Images({data,images,setImages}){const [busy,setBusy]=useState(false);useEffect(()=>{if(!data)return;setBusy(true);fetch('/api/images',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cancer:data.cancer})}).then(r=>r.json()).then(j=>setImages(j.images||[])).finally(()=>setBusy(false))},[data]);if(!data)return <><h1>Cancer Images</h1><Need/></>;return <><h1>Cancer Images</h1><p className="muted">Scientific and medically relevant images for {title(data.cancer)} cancer are retrieved from Wikimedia Commons. The gallery prioritizes MRI/CT, pathology, histology, microscopy, tumor specimens, segmentation, and medical diagrams; documents and unrelated photographs are excluded. Source/license metadata is shown when Commons supplies it.</p>{busy&&<p>Finding medically relevant scientific images…</p>}<div className="images">{images.map((x,i)=><div className="imagecard" key={i}><img src={x.thumbnail}/><h3>{x.title}</h3>{x.description&&<p className="muted">{clean(x.description).slice(0,180)}</p>}{x.license&&<p className="muted">License: {clean(x.license)}</p>}{x.artist&&<p className="muted">Creator: {clean(x.artist).slice(0,120)}</p>}<a href={x.original} target="_blank">Open original source</a></div>)}</div></>}
function About(){return <><h1>About Cancer Insight</h1><p>Cancer Insight is an educational cancer-research exploration platform. It combines a cancer-research API with PubMed/NCBI metadata so users can inspect papers, research themes, treatment evidence, and free-full-text availability while keeping the original sources visible.</p><h2>How treatment descriptions work</h2><p>Cancer Insight gives a plain-language definition of the treatment itself, then displays cancer-specific statements extracted from multiple PubMed-indexed abstracts. Each displayed research statement is linked back to identifiable PubMed sources through PMID references and source cards.</p><h2>Access labels</h2><ul><li><b>Free full text in PMC:</b> freely readable in PubMed Central; this does not automatically mean unrestricted reuse.</li><li><b>Full-text source link:</b> a publisher or research-source link is available; access rules may vary.</li><li><b>PubMed abstract:</b> an abstract is available even if Cancer Insight did not identify a free PMC copy.</li></ul><h2>Limitations</h2><p>Paper counts and research summaries describe retrieved literature, not treatment effectiveness, safety, or suitability for an individual patient. Automated extraction can miss context, so users should read the cited papers and consult qualified healthcare professionals for personal medical decisions.</p></>}
function simpleProfile(papers){const years=[],journals=new Set();let free=0,trials=0,reviews=0,meta=0;papers.forEach(p=>{if(p.pmc_id)free++;const y=(String(best(p,'pubmed_date','publicationDate')).match(/\b(19|20)\d{2}\b/)||[])[0];if(y)years.push(+y);const j=best(p,'pubmed_journal','journal');if(j)journals.add(j);const t=arr(p.publication_types).join(' ').toLowerCase();if(t.includes('clinical trial'))trials++;if(t.includes('review'))reviews++;if(t.includes('meta-analysis'))meta++});return{paper_count:papers.length,free_full_text_count:free,latest_year:years.length?Math.max(...years):null,journals:[...journals],journal_count:journals.size,clinical_trials:trials,reviews,meta_analyses:meta}}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
function pdfReport(cancer, papers, treatments) {
  const d = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Cancer Insight PDF palette
  const NAVY = [20, 61, 82];
  const TEAL = [31, 174, 174];
  const LIGHT = [239, 246, 248];
  const TEXT = [25, 54, 70];
  const MUTED = [92, 120, 136];
  const BORDER = [210, 225, 231];
  const WHITE = [255, 255, 255];

  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const contentW = pageW - margin * 2;

  let pageNumber = 1;
  let y = 0;

  // -----------------------------
  // Helpers
  // -----------------------------

  const safe = (value) => clean(value || "");

  const paperTitle = (p) =>
    safe(best(p, "pubmed_title", "title")) || "Untitled research paper";

  const journal = (p) =>
    safe(best(p, "pubmed_journal", "journal"));

  const date = (p) =>
    safe(best(p, "pubmed_date", "publicationDate"));

  const abstract = (p) =>
    safe(best(p, "pubmed_abstract", "abstract"));

  const authors = (p) =>
    safe(p.pubmed_authors);

  function footer() {
    d.setDrawColor(...BORDER);
    d.line(margin, 282, pageW - margin, 282);

    d.setFont("helvetica", "normal");
    d.setFontSize(7.5);
    d.setTextColor(...MUTED);

    d.text(
      "Educational use only. Cancer Insight does not provide medical diagnosis or individualized treatment advice.",
      margin,
      287
    );

    d.text(
      `Page ${pageNumber}`,
      pageW - margin,
      287,
      { align: "right" }
    );
  }

  function smallHeader() {
    d.setFillColor(...NAVY);
    d.rect(0, 0, pageW, 15, "F");

    d.setFillColor(...TEAL);
    d.roundedRect(margin, 4, 7, 7, 1.5, 1.5, "F");

    d.setTextColor(...WHITE);
    d.setFont("helvetica", "bold");
    d.setFontSize(9.5);
    d.text("+", margin + 3.5, 9.1, { align: "center" });

    d.setFontSize(10);
    d.text("Cancer Insight", margin + 11, 9.5);

    d.setFont("helvetica", "normal");
    d.setFontSize(7.5);
    d.text(
      `${title(cancer)} Cancer Research Report`,
      pageW - margin,
      9.5,
      { align: "right" }
    );
  }

  function newPage() {
    footer();
    d.addPage();
    pageNumber++;
    smallHeader();
    y = 24;
  }

  function ensureSpace(required) {
    if (y + required > 277) {
      newPage();
    }
  }

  // -----------------------------
  // COVER / REPORT HEADER
  // -----------------------------

  d.setFillColor(...NAVY);
  d.rect(0, 0, pageW, 54, "F");

  // Logo mark
  d.setFillColor(...TEAL);
  d.roundedRect(margin, 12, 13, 13, 2.5, 2.5, "F");

  d.setTextColor(...WHITE);
  d.setFont("helvetica", "bold");
  d.setFontSize(17);
  d.text("+", margin + 6.5, 21.3, { align: "center" });

  d.setFontSize(18);
  d.text("Cancer Insight", margin + 18, 20);

  d.setFont("helvetica", "normal");
  d.setFontSize(8.5);
  d.text(
    "Evidence-first cancer research explorer",
    margin + 18,
    26
  );

  d.setFont("helvetica", "bold");
  d.setFontSize(22);
  d.text("Research Report", margin, 43);

  // Cancer title
  y = 67;

  d.setTextColor(...TEXT);
  d.setFont("helvetica", "bold");
  d.setFontSize(24);
  d.text(`${title(cancer)} Cancer`, margin, y);

  y += 8;

  d.setFont("helvetica", "normal");
  d.setFontSize(10);
  d.setTextColor(...MUTED);
  d.text(
    "Research literature overview generated by Cancer Insight",
    margin,
    y
  );

  y += 13;

  // -----------------------------
  // SUMMARY CARDS
  // -----------------------------

  const freeCount = papers.filter((p) => p.pmc_id).length;

  const years = papers
    .map((p) => {
      const m = String(
        best(p, "pubmed_date", "publicationDate") || ""
      ).match(/\b(19|20)\d{2}\b/);

      return m ? Number(m[0]) : null;
    })
    .filter(Boolean);

  const latestYear = years.length
    ? Math.max(...years)
    : "—";

  const journals = new Set(
    papers
      .map((p) => journal(p))
      .filter(Boolean)
  ).size;

  const cards = [
    ["Research Papers", papers.length],
    ["Free Full Text", freeCount],
    ["Latest Year", latestYear],
    ["Treatment Types", treatments?.length || 0],
  ];

  const gap = 4;
  const cardW = (contentW - gap * 3) / 4;

  cards.forEach(([label, value], i) => {
    const x = margin + i * (cardW + gap);

    d.setFillColor(...LIGHT);
    d.setDrawColor(...BORDER);
    d.roundedRect(x, y, cardW, 25, 2.5, 2.5, "FD");

    d.setTextColor(...MUTED);
    d.setFont("helvetica", "normal");
    d.setFontSize(7.5);
    d.text(label, x + 4, y + 7);

    d.setTextColor(...NAVY);
    d.setFont("helvetica", "bold");
    d.setFontSize(16);
    d.text(String(value), x + 4, y + 18);
  });

  y += 35;

  // -----------------------------
  // REPORT OVERVIEW
  // -----------------------------

  d.setTextColor(...NAVY);
  d.setFont("helvetica", "bold");
  d.setFontSize(15);
  d.text("Research Overview", margin, y);

  y += 7;

  d.setTextColor(...TEXT);
  d.setFont("helvetica", "normal");
  d.setFontSize(9);

  const intro =
    `This report summarizes ${papers.length} research papers retrieved for ` +
    `${title(cancer)} cancer. Cancer Insight presents publication metadata, ` +
    `abstracts, treatment research coverage, and links to original scientific sources. ` +
    `The report describes retrieved research literature and does not rank treatments ` +
    `or provide medical recommendations.`;

  const introLines = d.splitTextToSize(intro, contentW);
  d.text(introLines, margin, y);

  y += introLines.length * 4.5 + 9;

  // -----------------------------
  // TREATMENT COVERAGE
  // -----------------------------

  if (treatments && treatments.length) {
    d.setTextColor(...NAVY);
    d.setFont("helvetica", "bold");
    d.setFontSize(15);
    d.text("Treatment Research Coverage", margin, y);

    y += 8;

    const treatmentList = treatments.slice(0, 8);

    const max = Math.max(
      1,
      ...treatmentList.map((x) => Number(x[1]) || 0)
    );

    treatmentList.forEach(([name, count]) => {
      ensureSpace(10);

      d.setTextColor(...TEXT);
      d.setFont("helvetica", "normal");
      d.setFontSize(8.5);

      const label = title(name);
      d.text(label.slice(0, 36), margin, y + 3);

      const barX = margin + 60;
      const barW = 90;

      d.setFillColor(224, 235, 239);
      d.roundedRect(barX, y, barW, 4, 1, 1, "F");

      d.setFillColor(...TEAL);

      const fill =
        Math.max(
          3,
          (Number(count) / max) * barW
        );

      d.roundedRect(barX, y, fill, 4, 1, 1, "F");

      d.setFont("helvetica", "bold");
      d.setTextColor(...NAVY);
      d.text(String(count), pageW - margin, y + 3, {
        align: "right",
      });

      y += 8;
    });

    y += 7;
  }

  // -----------------------------
  // RESEARCH PAPERS
  // -----------------------------

  ensureSpace(20);

  d.setTextColor(...NAVY);
  d.setFont("helvetica", "bold");
  d.setFontSize(17);
  d.text("Research Papers", margin, y);

  y += 5;

  d.setDrawColor(...TEAL);
  d.setLineWidth(0.8);
  d.line(margin, y, margin + 35, y);

  y += 10;

  papers.slice(0, 20).forEach((p, i) => {
    const t = paperTitle(p);
    const j = journal(p);
    const dt = date(p);
    const auth = authors(p);
    const abs = abstract(p);

    const titleLines = d.splitTextToSize(
      `${i + 1}. ${t}`,
      contentW - 12
    );

    const metaText = [j, dt, auth]
      .filter(Boolean)
      .join("  |  ");

    const metaLines = d.splitTextToSize(
      metaText,
      contentW - 12
    );

    let absText = abs;

    if (absText.length > 650) {
      absText = absText.slice(0, 647) + "...";
    }

    const abstractLines = absText
      ? d.splitTextToSize(absText, contentW - 12)
      : [];

    const treatmentsMentioned =
      arr(p.treatmentTypes).length
        ? arr(p.treatmentTypes)
            .map(title)
            .join(", ")
        : "";

    const treatmentLines = treatmentsMentioned
      ? d.splitTextToSize(
          `Treatments mentioned: ${treatmentsMentioned}`,
          contentW - 12
        )
      : [];

    const cardHeight =
      12 +
      titleLines.length * 5 +
      metaLines.length * 4 +
      abstractLines.length * 4 +
      treatmentLines.length * 4 +
      (p.pmc_id ? 6 : 0);

    ensureSpace(Math.min(cardHeight + 7, 80));

    const startY = y;

    d.setFillColor(250, 252, 253);
    d.setDrawColor(...BORDER);

    const renderHeight = Math.min(
      Math.max(cardHeight, 30),
      78
    );

    d.roundedRect(
      margin,
      startY,
      contentW,
      renderHeight,
      2.5,
      2.5,
      "FD"
    );

    // Paper number accent
    d.setFillColor(...TEAL);
    d.roundedRect(
      margin + 4,
      startY + 5,
      7,
      7,
      1.5,
      1.5,
      "F"
    );

    d.setTextColor(...WHITE);
    d.setFont("helvetica", "bold");
    d.setFontSize(7);
    d.text(
      String(i + 1),
      margin + 7.5,
      startY + 9.8,
      { align: "center" }
    );

    let py = startY + 9;

    // Title
    d.setTextColor(...NAVY);
    d.setFont("helvetica", "bold");
    d.setFontSize(10);

    d.text(
      titleLines,
      margin + 15,
      py
    );

    py += titleLines.length * 5 + 2;

    // Metadata
    if (metaLines.length) {
      d.setTextColor(...MUTED);
      d.setFont("helvetica", "normal");
      d.setFontSize(7.5);

      d.text(
        metaLines,
        margin + 15,
        py
      );

      py += metaLines.length * 4 + 3;
    }

    // Access badge
    if (p.pmc_id) {
      d.setFillColor(225, 245, 239);
      d.setTextColor(25, 115, 88);

      d.roundedRect(
        margin + 15,
        py - 3,
        30,
        5.5,
        1.5,
        1.5,
        "F"
      );

      d.setFont("helvetica", "bold");
      d.setFontSize(6.5);
      d.text(
        "FREE FULL TEXT",
        margin + 18,
        py + 0.7
      );

      py += 7;
    }

    // Abstract
    if (abstractLines.length) {
      d.setTextColor(...TEXT);
      d.setFont("helvetica", "normal");
      d.setFontSize(8);

      const availableLines = Math.max(
        1,
        Math.floor(
          (startY + renderHeight - py - 8) / 4
        )
      );

      const visibleAbstract =
        abstractLines.slice(0, availableLines);

      d.text(
        visibleAbstract,
        margin + 15,
        py
      );

      py += visibleAbstract.length * 4 + 3;
    }

    // Treatment information
    if (
      treatmentLines.length &&
      py < startY + renderHeight - 6
    ) {
      d.setTextColor(...TEAL);
      d.setFont("helvetica", "bold");
      d.setFontSize(7);

      d.text(
        treatmentLines.slice(0, 2),
        margin + 15,
        py
      );
    }

    y = startY + renderHeight + 6;
  });

  // -----------------------------
  // SOURCES / FINAL NOTE
  // -----------------------------

  ensureSpace(40);

  d.setFillColor(...LIGHT);
  d.setDrawColor(...BORDER);
  d.roundedRect(
    margin,
    y,
    contentW,
    31,
    2.5,
    2.5,
    "FD"
  );

  d.setTextColor(...NAVY);
  d.setFont("helvetica", "bold");
  d.setFontSize(10);
  d.text("Sources & Interpretation", margin + 6, y + 8);

  d.setTextColor(...TEXT);
  d.setFont("helvetica", "normal");
  d.setFontSize(7.8);

  const sourceText =
    "Cancer Insight keeps original research sources visible whenever available, " +
    "including PubMed, PubMed Central (PMC), DOI, and publisher links. " +
    "Paper counts and treatment coverage describe the retrieved literature only " +
    "and should not be interpreted as evidence that one treatment is superior.";

  d.text(
    d.splitTextToSize(sourceText, contentW - 12),
    margin + 6,
    y + 14
  );

  // Footer for final page
  footer();

  // -----------------------------
  // PDF metadata
  // -----------------------------

  d.setProperties({
    title: `Cancer Insight - ${title(cancer)} Cancer Research Report`,
    subject: `${title(cancer)} cancer research literature`,
    author: "Cancer Insight",
    creator: "Cancer Insight",
  });

  d.save(
    `cancer_insight_${String(cancer)
      .replace(/\s+/g, "_")
      .toLowerCase()}_research_report.pdf`
  );
}
