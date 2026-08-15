"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { curriculum, type Lesson, type Unit } from "./curriculum";

const STAGES: Unit["stage"][] = ["启蒙补基础", "七年级", "八年级", "九年级"];
const STAGE_SHORT: Record<Unit["stage"], string> = {
  启蒙补基础: "先补基础",
  七年级: "七年级",
  八年级: "八年级",
  九年级: "九年级",
};

type LessonWithUnit = Lesson & { unit: Unit; number: number };

function stageClass(stage: Unit["stage"]) {
  return stage === "启蒙补基础"
    ? "foundation"
    : stage === "七年级"
      ? "grade-seven"
      : stage === "八年级"
        ? "grade-eight"
        : "grade-nine";
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div
      className="progress-ring"
      style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}
      role="img"
      aria-label={`已学完百分之${percent}`}
    >
      <div>
        <strong>{percent}%</strong>
        <span>已学完</span>
      </div>
    </div>
  );
}

function HomeView({
  allLessons,
  completed,
  onOpen,
}: {
  allLessons: LessonWithUnit[];
  completed: Set<string>;
  onOpen: (id: string) => void;
}) {
  const firstUnfinished = allLessons.find((lesson) => !completed.has(lesson.id));

  return (
    <main className="main-content" id="main-content">
      <section className="welcome-card">
        <div className="welcome-copy">
          <p className="eyebrow">从不识字母，也能慢慢学会</p>
          <h1>小包子学数学</h1>
          <p className="welcome-lead">
            奶奶，数学不是比谁学得快。每天学一小课，拿纸和笔跟着算，学会一点就是一点。
          </p>
          <button
            className="primary-button"
            onClick={() => firstUnfinished && onOpen(firstUnfinished.id)}
            disabled={!firstUnfinished}
          >
            <span aria-hidden="true">▶</span>
            {completed.size === 0 ? "从第一课开始" : "接着上次学习"}
          </button>
        </div>
        <div className="welcome-progress">
          <ProgressRing done={completed.size} total={allLessons.length} />
          <p>
            共 <strong>{allLessons.length}</strong> 小课
          </p>
        </div>
      </section>

      <section className="how-to" aria-labelledby="how-title">
        <div className="section-heading">
          <p className="section-kicker">学习方法</p>
          <h2 id="how-title">一课只做四件事</h2>
        </div>
        <ol className="learning-steps">
          <li>
            <span>1</span>
            <div><strong>读一读</strong><p>慢慢读“这是什么”，不认识的词多读两遍。</p></div>
          </li>
          <li>
            <span>2</span>
            <div><strong>抄一抄</strong><p>把例题抄在本子上，照着步骤亲手算一遍。</p></div>
          </li>
          <li>
            <span>3</span>
            <div><strong>做一做</strong><p>先自己做练习，想不出时再看小提示。</p></div>
          </li>
          <li>
            <span>4</span>
            <div><strong>歇一歇</strong><p>对完答案就打勾。一天一课已经很棒。</p></div>
          </li>
        </ol>
      </section>

      <section className="roadmap" aria-labelledby="roadmap-title">
        <div className="section-heading">
          <p className="section-kicker">完整目录</p>
          <h2 id="roadmap-title">四段路，先打地基再上楼</h2>
          <p>一定按顺序学。“补基础”不是丢脸，是给后面的知识铺一条平路。</p>
        </div>
        <div className="stage-grid">
          {STAGES.map((stage, stageIndex) => {
            const units = curriculum.filter((unit) => unit.stage === stage);
            const lessons = units.flatMap((unit) => unit.lessons);
            const done = lessons.filter((lesson) => completed.has(lesson.id)).length;
            return (
              <article className={`stage-card ${stageClass(stage)}`} key={stage}>
                <div className="stage-number">第 {stageIndex + 1} 段</div>
                <h3>{STAGE_SHORT[stage]}</h3>
                <p>{units.length} 个单元 · {lessons.length} 小课</p>
                <div className="mini-progress" aria-label={`${stage}完成进度`}>
                  <span style={{ width: `${lessons.length ? (done / lessons.length) * 100 : 0}%` }} />
                </div>
                <p className="done-count">已学 {done} / {lessons.length}</p>
                <button onClick={() => lessons[0] && onOpen(lessons[0].id)}>
                  查看这段课程 <span aria-hidden="true">→</span>
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="reassurance">
        <span aria-hidden="true">✿</span>
        <div>
          <h2>算错了，也是在学习</h2>
          <p>看答案前先想一想；看过答案后，把错题重新算一遍。数学就是这样一点点熟起来的。</p>
        </div>
      </section>
    </main>
  );
}

function LessonView({
  lesson,
  completed,
  onToggleComplete,
  onOpen,
  allLessons,
}: {
  lesson: LessonWithUnit;
  completed: boolean;
  onToggleComplete: () => void;
  onOpen: (id: string) => void;
  allLessons: LessonWithUnit[];
}) {
  const position = allLessons.findIndex((item) => item.id === lesson.id);
  const previous = position > 0 ? allLessons[position - 1] : undefined;
  const next = position < allLessons.length - 1 ? allLessons[position + 1] : undefined;

  return (
    <main className="main-content lesson-page" id="main-content">
      <nav className="crumbs" aria-label="当前位置">
        <button onClick={() => onOpen("")}>课程首页</button>
        <span aria-hidden="true">›</span>
        <span>{lesson.unit.stage}</span>
        <span aria-hidden="true">›</span>
        <span>{lesson.unit.title}</span>
      </nav>

      <article>
        <header className={`lesson-hero ${stageClass(lesson.unit.stage)}`}>
          <div>
            <p className="lesson-label">第 {lesson.number} 课 · {lesson.unit.title}</p>
            <h1>{lesson.title}</h1>
            <p>{lesson.intro}</p>
          </div>
          <div className="lesson-mark" aria-hidden="true">{lesson.number}</div>
        </header>

        <section className="lesson-section idea-section" aria-labelledby="ideas-title">
          <div className="section-icon" aria-hidden="true">灯</div>
          <div className="lesson-section-body">
            <h2 id="ideas-title">先弄明白</h2>
            <ul className="idea-list">
              {lesson.ideas.map((idea, index) => <li key={index}>{idea}</li>)}
            </ul>
            {lesson.tip && (
              <aside className="tip-box">
                <strong>记一记：</strong>{lesson.tip}
              </aside>
            )}
          </div>
        </section>

        <section className="lesson-section" aria-labelledby="example-title">
          <div className="section-icon example-icon" aria-hidden="true">例</div>
          <div className="lesson-section-body">
            <h2 id="example-title">跟着例题学</h2>
            {lesson.examples.map((example, exampleIndex) => (
              <div className="example-card" key={exampleIndex}>
                <div className="question-line">
                  <span>例题 {exampleIndex + 1}</span>
                  <p>{example.question}</p>
                </div>
                <div className="worked-steps">
                  <p className="small-label">一步一步来</p>
                  <ol>
                    {example.steps.map((step, index) => (
                      <li key={index}><span>{index + 1}</span><p>{step}</p></li>
                    ))}
                  </ol>
                </div>
                <p className="example-answer"><strong>答：</strong>{example.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lesson-section" aria-labelledby="practice-title">
          <div className="section-icon practice-icon" aria-hidden="true">练</div>
          <div className="lesson-section-body">
            <h2 id="practice-title">自己试一试</h2>
            <p className="practice-note">拿纸和笔先算。做完后，再点开提示或答案。</p>
            <div className="practice-list">
              {lesson.practice.map((item, index) => (
                <article className="practice-card" key={index}>
                  <div className="practice-question">
                    <span>{index + 1}</span>
                    <p>{item.question}</p>
                  </div>
                  <details>
                    <summary>想不出来？看小提示</summary>
                    <p>{item.hint}</p>
                  </details>
                  <details className="answer-details">
                    <summary>做完了，对答案</summary>
                    <p>{item.answer}</p>
                  </details>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`completion-card ${completed ? "is-complete" : ""}`}>
          <div>
            <span className="completion-check" aria-hidden="true">{completed ? "✓" : "○"}</span>
            <div>
              <h2>{completed ? "这一课学完啦！" : "这一课学明白了吗？"}</h2>
              <p>{completed ? "小小的一步，也值得高兴。" : "例题抄过、练习做过，就可以打勾。"}</p>
            </div>
          </div>
          <button onClick={onToggleComplete}>
            {completed ? "取消完成" : "标记为学完"}
          </button>
        </section>

        <nav className="lesson-pager" aria-label="前后课程">
          {previous ? (
            <button onClick={() => onOpen(previous.id)} className="previous-lesson">
              <span>← 上一课</span><strong>{previous.title}</strong>
            </button>
          ) : <span />}
          {next ? (
            <button onClick={() => onOpen(next.id)} className="next-lesson">
              <span>下一课 →</span><strong>{next.title}</strong>
            </button>
          ) : <span />}
        </nav>
      </article>
    </main>
  );
}

export default function Home() {
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [fontScale, setFontScale] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);

  const allLessons = useMemo<LessonWithUnit[]>(() => {
    let number = 0;
    return curriculum.flatMap((unit) =>
      unit.lessons.map((lesson) => ({ ...lesson, unit, number: ++number })),
    );
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("math-completed-lessons");
    const savedScale = Number(window.localStorage.getItem("math-font-scale"));
    if (saved) {
      try { setCompleted(new Set(JSON.parse(saved) as string[])); } catch { /* ignore old data */ }
    }
    if (savedScale >= 0.9 && savedScale <= 1.25) setFontScale(savedScale);
    const hashId = decodeURIComponent(window.location.hash.replace("#lesson-", ""));
    if (allLessons.some((lesson) => lesson.id === hashId)) setSelectedLessonId(hashId);
  }, [allLessons]);

  const selectedLesson = allLessons.find((lesson) => lesson.id === selectedLessonId);
  const searchResults = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return [];
    return allLessons.filter((lesson) =>
      [lesson.title, lesson.intro, lesson.unit.title, lesson.unit.stage, ...lesson.ideas]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    ).slice(0, 12);
  }, [allLessons, search]);

  function openLesson(id: string) {
    setSelectedLessonId(id);
    setSearch("");
    setMenuOpen(false);
    if (id) window.history.replaceState(null, "", `#lesson-${encodeURIComponent(id)}`);
    else window.history.replaceState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleCompleted(id: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      window.localStorage.setItem("math-completed-lessons", JSON.stringify([...next]));
      return next;
    });
  }

  function changeFont(delta: number) {
    setFontScale((current) => {
      const next = Math.min(1.2, Math.max(0.9, Number((current + delta).toFixed(2))));
      window.localStorage.setItem("math-font-scale", String(next));
      return next;
    });
  }

  return (
    <div className="site-shell" style={{ "--font-scale": fontScale } as React.CSSProperties}>
      <a className="skip-link" href="#main-content">跳到正文</a>
      <header className="topbar">
        <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="打开课程目录">☰</button>
        <button className="brand" onClick={() => openLesson("")} aria-label="回到课程首页">
          <span className="brand-seal">数</span>
          <span><strong>小包子学数学</strong><small>零基础 · 初中全课程</small></span>
        </button>
        <div className="topbar-actions">
          <div className="font-controls" aria-label="字体大小">
            <span>字</span>
            <button onClick={() => changeFont(-0.1)} aria-label="缩小字体">小</button>
            <button onClick={() => changeFont(0.1)} aria-label="放大字体">大</button>
          </div>
          <button className="print-button" onClick={() => window.print()} aria-label="打印当前课程">打印</button>
        </div>
      </header>

      <div className="body-layout">
        <aside className={`sidebar ${menuOpen ? "menu-open" : ""}`} aria-label="课程目录">
          <div className="mobile-menu-head">
            <strong>课程目录</strong>
            <button onClick={() => setMenuOpen(false)} aria-label="关闭课程目录">×</button>
          </div>
          <div className="search-wrap">
            <label htmlFor="course-search">找一找课程</label>
            <div className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                ref={searchInput}
                id="course-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="例如：分数、三角形"
              />
              {search && <button onClick={() => setSearch("")} aria-label="清空搜索">×</button>}
            </div>
            {search && (
              <div className="search-results" aria-live="polite">
                <p>找到 {searchResults.length} 个相关课程</p>
                {searchResults.map((lesson) => (
                  <button key={lesson.id} onClick={() => openLesson(lesson.id)}>
                    <span>{lesson.unit.stage}</span>{lesson.title}
                  </button>
                ))}
                {searchResults.length === 0 && <div className="empty-search">换个简单的词试试</div>}
              </div>
            )}
          </div>

          <button className={`home-link ${!selectedLesson ? "active" : ""}`} onClick={() => openLesson("")}>
            <span aria-hidden="true">⌂</span> 学习首页
          </button>

          <nav className="course-nav">
            {STAGES.map((stage) => {
              const units = curriculum.filter((unit) => unit.stage === stage);
              const stageLessonIds = units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
              const stageDone = stageLessonIds.filter((id) => completed.has(id)).length;
              return (
                <details key={stage} open={selectedLesson?.unit.stage === stage || stage === "启蒙补基础"}>
                  <summary>
                    <span className={`stage-dot ${stageClass(stage)}`} />
                    <strong>{STAGE_SHORT[stage]}</strong>
                    <small>{stageDone}/{stageLessonIds.length}</small>
                  </summary>
                  {units.map((unit) => (
                    <div className="unit-group" key={unit.id}>
                      <p>{unit.title}</p>
                      {unit.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          className={selectedLessonId === lesson.id ? "active" : ""}
                          onClick={() => openLesson(lesson.id)}
                        >
                          <span className={completed.has(lesson.id) ? "lesson-done" : "lesson-undone"}>
                            {completed.has(lesson.id) ? "✓" : ""}
                          </span>
                          {lesson.title}
                        </button>
                      ))}
                    </div>
                  ))}
                </details>
              );
            })}
          </nav>
          <div className="sidebar-note">
            <strong>不会没关系</strong>
            <p>退回前一课，再看一次例题。慢慢来，记得更牢。</p>
          </div>
        </aside>
        {menuOpen && <button className="menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="关闭目录" />}

        {selectedLesson ? (
          <LessonView
            lesson={selectedLesson}
            completed={completed.has(selectedLesson.id)}
            onToggleComplete={() => toggleCompleted(selectedLesson.id)}
            onOpen={openLesson}
            allLessons={allLessons}
          />
        ) : (
          <HomeView allLessons={allLessons} completed={completed} onOpen={openLesson} />
        )}
      </div>
      <footer>
        <p>小包子学数学 · 给每一位愿意重新开始的人</p>
        <p>每天一小课，不赶时间。</p>
      </footer>
    </div>
  );
}
