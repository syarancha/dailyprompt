(function () {
  window.dataLayer = window.dataLayer || [];

  window.trackEvent = function trackEvent(name, params) {
    window.dataLayer.push({
      event: name,
      ...(params || {})
    });
  };

  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-track-event]');
    if (!el) return;

    const eventName = el.dataset.trackEvent;
    const label = el.dataset.trackLabel || '';
    const href = el.getAttribute('href') || '';

    window.trackEvent(eventName, {
      label,
      link_url: href,
      link_text: (el.textContent || '').trim(),
      page_path: window.location.pathname
    });
  });

  const FINAL_COPY_DATA = {
    botName: '하로',
    botAvatar: '/assets/images/haro_profile.png',
    CONTACT_PAGE_URL: 'https://www.secondbrush.co.kr/contact/',
    welcome: {
      messages: [
        '안녕하세요. 세컨드 브러시의 AI 비서, 하로입니다.',
        '아래에서 질문을 골라주시면, 딱 맞는 답으로 바로 안내해드릴게요.'
      ],
      quickReplies: [
        { label: '강의 문의를 하고 싶어요', action: { type: 'runSequence', id: 'lecture' } },
        { label: '뉴스레터 내 광고를 하고 싶어요', action: { type: 'runSequence', id: 'ads' } },
        { label: '외주 제작도 받으시나요?', action: { type: 'runSequence', id: 'collab' } },
        { label: '그 외 문의를 하고 싶어요', action: { type: 'runSequence', id: 'other_inquiry' } }
      ]
    },
    sequences: {
      home: {
        messages: [
          '어떤 내용이 궁금하세요? 아래 항목에서 골라주세요.'
        ],
        quickReplies: [
          { label: '강의 문의를 하고 싶어요', action: { type: 'runSequence', id: 'lecture' } },
          { label: '뉴스레터 내 광고를 하고 싶어요', action: { type: 'runSequence', id: 'ads' } },
          { label: '외주 제작도 받으시나요?', action: { type: 'runSequence', id: 'collab' } },
          { label: '그 외 문의를 하고 싶어요', action: { type: 'runSequence', id: 'other_inquiry' } }
        ]
      },

      lecture: {
        messages: [
          '강의 만족도 만점을 기록할 정도로 열성을 다해 강의를 한다는 소문을 벌써 들으셨군요?😉\n진행 가능한 주제는 다음과 같아요.\n\n- **생성형 AI 전반 트렌드 특강**\n- **이미지 및 영상 생성 등 콘텐츠 제작 워크숍**\n- **디자이너를 위한 생성형 AI 활용법**\n\n미리 아래와 같이 양해 말씀도 함께 전해드려요.\n\n1️⃣ 강의 날짜 기준 최소 1달 전에 문의를 해주시는 게 좋아요. 일정이 빠르게 마감되고 있어요.\n2️⃣ 온/오프라인 강의 진행 시, 별도 녹화 및 보관은 원하지 않아요.\n3️⃣ 온라인 강의 제작은 현재 받지 않고 있어요.\n\n상세한 일정과 예산은 Contact 페이지를 통해 문의 남겨주세요.'
        ],
        quickReplies: [
          { label: 'Contact 페이지에 남기기', action: { type: 'openUrl', url: 'CONTACT_PAGE_URL' } },
          { label: '문의 템플릿 보기', action: { type: 'runSequence', id: 'lecture_template' } },
          { label: '처음으로', action: { type: 'runSequence', id: 'home' } }
        ]
      },

      lecture_template: {
        messages: [
          '아래 템플릿을 그대로 복사해서 Contact 페이지에 남겨주세요. 확인이 훨씬 빨라집니다.\n\n[강의 문의 템플릿]\n- 희망 날짜/시간:\n- 장소/형태(오프라인/온라인):\n- 예상 인원:\n- 예산 범위:\n- 대상(직군/레벨):\n- 원하는 주제:\n- 목표(참가자가 얻어가길 원하는 것):\n- 기타 요청:'
        ],
        quickReplies: [
          { label: 'Contact 페이지 열기', action: { type: 'openUrl', url: 'CONTACT_PAGE_URL' } },
          { label: '처음으로', action: { type: 'runSequence', id: 'home' } }
        ]
      },

      ads: {
        messages: [
          "뉴스레터 내 광고를 원하시는군요. 뉴스레터 <Daily Prompt>는 2023년 5월 1일부터 매일 꾸준히 발행되고 있습니다. 무료로 알기 쉽게 AI 정보를 공유하며 구독자로부터 높은 신뢰를 받고 있어요. 그래서 구독자들은 '데일리 프롬프트'의 추천은 믿을만하다고 생각한답니다.\n\n<Daily Prompt>와의 협업은 이런 분과 하고 싶어요:\n\n1️⃣ **사람 간의 신뢰를 의미있게 여기는 분**\n2️⃣ **뉴스레터를 통해 홍보할 제품에 대한 애정이 크신 분**\n3️⃣ **무엇보다 콘텐츠의 기획과 방향에 대해 전적으로 발행인에게 맡길 수 있는 분**\n\n위 3가지에 모두 해당이 되시나요?"
        ],
        quickReplies: [
          { label: '네 해당되어요!', action: { type: 'runSequence', id: 'ads_ready' } },
          { label: '처음으로', action: { type: 'runSequence', id: 'home' } }
        ]
      },

      ads_ready: {
        messages: [
          '뉴스레터 광고는 두 가지 방식으로 진행됩니다.\n\n**1️⃣ 프리미엄 콘텐츠:** 뉴스레터 지문 전체를 제품 소개에 할애합니다. 단순히 tutorial을 전달하는 콘텐츠가 아니라 어떻게 하면 이 제품을 사용자가 보다 잘 쓸수 있을지 고민하고 use case를 개발해서 소개하고 있어요. [참고회차](https://blog.secondbrush.co.kr/dailyprompt-676/)\n\n**2️⃣ 하단 배너:** 뉴스레터 하단에 배너와 함께 간략한 소개글이 들어갑니다\n\n참고로 프리미엄 콘텐츠는 뉴스레터의 지속가능성을 위해 월 1회만 협업하고 있어요.\n\n상세한 일정과 예산, 희망 방식(프리미엄/하단 배너)을 Contact 페이지에 남겨주시면, 뉴스레터 지표(오픈율, 클릭률)와 함께 답변드릴게요!'
        ],
        quickReplies: [
          { label: '문의하기', action: { type: 'openUrl', url: 'CONTACT_PAGE_URL' } },
          { label: '처음으로', action: { type: 'runSequence', id: 'home' } }
        ]
      },

      collab: {
        messages: [
          '협업 제안 감사합니다. 다만 먼저 안내드릴 내용이 있어요.',
          '생성형 AI 콘텐츠 제작 외주 작업 문의는 받지 않습니다. 클라이언트 작업보다는 개인의 창의성과 작업에 더 집중하고 있습니다.',
          '그 외 문의가 있으시다면 Contact 페이지에 남겨주세요.'
        ],
        quickReplies: [
          { label: 'Contact 페이지에 남기기', action: { type: 'openUrl', url: 'CONTACT_PAGE_URL' } },
          { label: '처음으로', action: { type: 'runSequence', id: 'home' } }
        ]
      },

      other_inquiry: {
        messages: [
          '그 외 문의는 Contact 페이지에 남겨주시면 확인 후 답변 드릴게요:)'
        ],
        quickReplies: [
          { label: 'Contact 페이지에 남기기', action: { type: 'openUrl', url: 'CONTACT_PAGE_URL' } },
          { label: '처음으로', action: { type: 'runSequence', id: 'home' } }
        ]
      },

      fallback: {
        messages: [
          '해당 질문은 현재 준비된 답변이 없습니다. 아래 항목 중에서 선택해주시면 정확히 안내해드릴게요.'
        ],
        quickReplies: [
          { label: '강의 문의를 하고 싶어요', action: { type: 'runSequence', id: 'lecture' } },
          { label: '뉴스레터 내 광고를 하고 싶어요', action: { type: 'runSequence', id: 'ads' } },
          { label: '외주 제작도 받으시나요?', action: { type: 'runSequence', id: 'collab' } },
          { label: '그 외 문의를 하고 싶어요', action: { type: 'runSequence', id: 'other_inquiry' } }
        ]
      }
    }
  };

  function escapeHtml(value) {
    return (value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  const SPECIAL_NEWSLETTER_URL = 'https://blog.secondbrush.co.kr/dailyprompt-special-may2nd/';

  function formatAssistantHtml(text) {
    const escaped = escapeHtml(text).replace(/\n/g, '<br />');
    const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const withMarkdownLinks = withBold.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a class="chat-inline-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    return withMarkdownLinks.replace(
      /뉴스레터 특집호/g,
      `<a class="chat-inline-link" href="${SPECIAL_NEWSLETTER_URL}" target="_blank" rel="noopener noreferrer">뉴스레터 특집호</a>`
    );
  }

  function replaceContactUrl(value, contactUrl) {
    if (typeof value === 'string') {
      return value.replaceAll('CONTACT_PAGE_URL', contactUrl);
    }

    if (Array.isArray(value)) {
      return value.map((item) => replaceContactUrl(item, contactUrl));
    }

    if (value && typeof value === 'object') {
      const out = {};
      Object.keys(value).forEach((key) => {
        out[key] = replaceContactUrl(value[key], contactUrl);
      });
      return out;
    }

    return value;
  }

  function createAskModal(copyData) {
    const modal = document.createElement('section');
    modal.className = 'ask-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="ask-modal-backdrop" data-ask-close></div>
      <div class="ask-modal-panel" role="dialog" aria-modal="true" aria-label="Ask assistant">
        <header class="ask-modal-header">
          <div class="ask-agent">
            <img class="ask-agent-avatar" src="${copyData.botAvatar}" alt="${copyData.botName} 프로필" />
            <h2 class="ask-modal-title">${copyData.botName} · Second Brush Assistant</h2>
          </div>
          <button type="button" class="ask-modal-close" data-ask-close>Close</button>
        </header>
        <div class="ask-chat-log" data-ask-log></div>
        <div class="ask-quick" data-ask-quick></div>
      </div>
    `;

    const log = modal.querySelector('[data-ask-log]');
    const quick = modal.querySelector('[data-ask-quick]');
    const state = {
      messageId: 0,
      busy: false
    };

    function scrollToBottom() {
      log.scrollTop = log.scrollHeight;
    }

    function setBusy(isBusy) {
      state.busy = isBusy;
      const buttons = Array.from(quick.querySelectorAll('button'));
      buttons.forEach((button) => {
        button.disabled = isBusy;
      });
    }

    function addMessage(role, text) {
      state.messageId += 1;
      const msg = document.createElement('article');
      msg.className = `chat-msg ${role}`;
      msg.dataset.messageId = String(state.messageId);

      if (role === 'assistant') {
        msg.innerHTML = `<div class="chat-head"><img class="chat-avatar" src="${copyData.botAvatar}" alt="${copyData.botName} 프로필" /><span class="chat-name">${copyData.botName}</span></div><div>${formatAssistantHtml(text)}</div>`;
      } else {
        const safeText = escapeHtml(text).replace(/\n/g, '<br />');
        msg.innerHTML = `<div>${safeText}</div>`;
      }

      log.appendChild(msg);
      scrollToBottom();
    }

    function addAssistantBundle(text, inlineActions) {
      state.messageId += 1;
      const msg = document.createElement('article');
      msg.className = 'chat-msg assistant';
      msg.dataset.messageId = String(state.messageId);

      const head = document.createElement('div');
      head.className = 'chat-head';

      const avatar = document.createElement('img');
      avatar.className = 'chat-avatar';
      avatar.src = copyData.botAvatar;
      avatar.alt = `${copyData.botName} 프로필`;

      const name = document.createElement('span');
      name.className = 'chat-name';
      name.textContent = copyData.botName;

      const body = document.createElement('div');
      body.innerHTML = formatAssistantHtml(text);

      head.appendChild(avatar);
      head.appendChild(name);
      msg.appendChild(head);
      msg.appendChild(body);

      if (Array.isArray(inlineActions) && inlineActions.length) {
        const actionsWrap = document.createElement('div');
        actionsWrap.className = 'chat-inline-actions';

        inlineActions.forEach((item) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = item.label;
          button.addEventListener('click', () => {
            const url = item.action?.url;
            if (!url) return;
            if (typeof window.trackEvent === 'function') {
              window.trackEvent('cta_click', {
                label: item.label,
                link_url: url,
                page_path: window.location.pathname
              });
            }
            window.open(url, '_blank', 'noopener,noreferrer');
          });
          actionsWrap.appendChild(button);
        });

        msg.appendChild(actionsWrap);
      }

      log.appendChild(msg);
      scrollToBottom();
    }

    function renderQuickReplies(quickReplies) {
      quick.innerHTML = '';

      (quickReplies || []).forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = item.label;
        button.addEventListener('click', () => {
          onQuickReplyClick(item);
        });
        quick.appendChild(button);
      });
    }

    function delay(ms) {
      return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });
    }

    async function appendAssistantMessages(messages, timing) {
      const list = Array.isArray(messages) ? messages : [];
      const firstDelay = timing?.firstDelay ?? 180;
      const nextDelay = timing?.nextDelay ?? 260;
      for (let i = 0; i < list.length; i += 1) {
        await delay(i === 0 ? firstDelay : nextDelay);
        addMessage('assistant', list[i]);
      }
    }

    function openExternalUrl(url) {
      if (!url) return;
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    async function resetToWelcome() {
      log.innerHTML = '';
      renderQuickReplies([]);
      await appendAssistantMessages(copyData.welcome.messages, {
        firstDelay: 440,
        nextDelay: 420
      });
      renderQuickReplies(copyData.welcome.quickReplies);
    }

    async function runSequence(id, selectedLabel) {
      if (id === 'home') {
        await resetToWelcome();
        return;
      }

      const sequence = copyData.sequences[id] || copyData.sequences.fallback;

      if (selectedLabel) {
        addMessage('user', selectedLabel);
      }

      await delay(220);
      const mergedText = (sequence.messages || []).join('\n\n');
      const replies = Array.isArray(sequence.quickReplies) ? sequence.quickReplies : [];
      const inlineActions = replies.filter((item) => item.action?.type === 'openUrl');
      const nextReplies = replies.filter((item) => item.action?.type !== 'openUrl');

      addAssistantBundle(mergedText, inlineActions);
      renderQuickReplies(nextReplies);
    }

    async function onQuickReplyClick(item) {
      if (state.busy || !item || !item.action) return;
      setBusy(true);

      const action = item.action;
      try {
        if (typeof window.trackEvent === 'function') {
          window.trackEvent('inquiry_click', {
            label: item.label,
            page_path: window.location.pathname
          });
        }

        if (action.type === 'runSequence') {
          await runSequence(action.id, item.label);
        } else if (action.type === 'openUrl') {
          addMessage('user', item.label);
          openExternalUrl(action.url);
          await appendAssistantMessages(['상세한 내용은 Contact 페이지에 남겨주세요.']);
        } else {
          await runSequence('fallback', item.label);
        }
      } finally {
        setBusy(false);
        scrollToBottom();
      }
    }

    async function onOpen() {
      await resetToWelcome();
      scrollToBottom();
    }

    modal.addEventListener('ask:open', () => {
      onOpen();
    });

    document.body.appendChild(modal);
    return modal;
  }

  const askBars = Array.from(document.querySelectorAll('.ask-bar'));
  if (!askBars.length) return;

  const copyData = replaceContactUrl(FINAL_COPY_DATA, FINAL_COPY_DATA.CONTACT_PAGE_URL);
  const askModal = createAskModal(copyData);
  const closeSelectors = '[data-ask-close]';

  function openAskModal() {
    askModal.classList.add('is-open');
    askModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    askModal.dispatchEvent(new CustomEvent('ask:open'));
  }

  function closeAskModal() {
    askModal.classList.remove('is-open');
    askModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  askBars.forEach((bar) => {
    bar.addEventListener('click', (event) => {
      event.preventDefault();
      openAskModal();
    });
  });

  askModal.addEventListener('click', (event) => {
    if (event.target.closest(closeSelectors)) {
      closeAskModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && askModal.classList.contains('is-open')) {
      closeAskModal();
    }
  });

  const contactForm = document.querySelector('form[data-contact-mailto="1"]');
  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const notionInquiryUrl = 'https://iamarancia.notion.site/1a06ec0e5cd2808f8db0ca2d5a79ece3?pvs=105';

      if (typeof window.trackEvent === 'function') {
        window.trackEvent('inquiry_click', {
          label: 'contact_notion_redirect',
          link_url: notionInquiryUrl,
          page_path: window.location.pathname
        });
      }

      window.location.href = notionInquiryUrl;
    });
  }
})();
