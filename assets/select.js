/* Custom dropdowns in the site's style, layered over each native <select> in a
   .float-field. The native select stays in the form (value, required, change
   events); phones keep their native picker, which suits touch better. */
(() => {
  if (!matchMedia('(pointer: fine)').matches) return;
  const check = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="m3.5 8.3 2.9 2.9 6.1-6.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let count = 0;

  document.querySelectorAll('.float-field.is-select > select').forEach(select => {
    const field = select.parentElement;
    const label = field.querySelector('label');
    const id = `select-${++count}`;
    label.id ||= `${id}-label`;
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    field.classList.add('is-custom');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${id}-list`);
    trigger.setAttribute('aria-labelledby', `${label.id} ${id}-value`);
    trigger.innerHTML = `<span class="select-value" id="${id}-value"></span>`;

    const list = document.createElement('ul');
    list.className = 'select-list';
    list.id = `${id}-list`;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-labelledby', label.id);
    list.tabIndex = -1;
    list.hidden = true;
    // The empty "Choose" option only labels the closed field; it is not offered in the list.
    const options = [...select.options].map((option, index) => [option, index]).filter(([option]) => option.value).map(([option, index]) => {
      const item = document.createElement('li');
      item.id = `${id}-option-${index}`;
      item.setAttribute('role', 'option');
      item.dataset.index = index;
      item.innerHTML = `<span></span>${check}`;
      item.firstChild.textContent = option.textContent;
      list.append(item);
      return item;
    });
    field.append(trigger, list);

    let active = 0;
    const selected = () => Math.max(0, options.findIndex(item => Number(item.dataset.index) === select.selectedIndex));
    const render = () => {
      trigger.querySelector('.select-value').textContent = select.options[select.selectedIndex].textContent;
      trigger.classList.toggle('is-placeholder', !select.value);
      options.forEach(item => item.setAttribute('aria-selected', String(Number(item.dataset.index) === select.selectedIndex)));
    };
    const highlight = (position, scroll = true) => {
      active = Math.max(0, Math.min(options.length - 1, position));
      options.forEach((item, i) => item.classList.toggle('is-active', i === active));
      list.setAttribute('aria-activedescendant', options[active].id);
      if (scroll) options[active].scrollIntoView({ block: 'nearest' });
    };
    const open = () => {
      document.querySelectorAll('.select-list:not([hidden])').forEach(other => other !== list && other.dispatchEvent(new Event('close')));
      list.hidden = false;
      field.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      list.scrollTop = 0;
      highlight(selected());
      list.focus({ preventScroll: true });
    };
    const close = (refocus = true) => {
      if (list.hidden) return;
      list.hidden = true;
      field.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (refocus) trigger.focus({ preventScroll: true });
    };
    const choose = position => {
      const index = Number(options[position].dataset.index);
      if (select.selectedIndex !== index) {
        select.selectedIndex = index;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      render();
      close();
    };

    trigger.addEventListener('click', () => (list.hidden ? open() : close()));
    trigger.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); open(); }
    });
    list.addEventListener('close', () => close(false));
    list.addEventListener('click', event => {
      const item = event.target.closest('[role=option]');
      if (item) choose(options.indexOf(item));
    });
    list.addEventListener('mousemove', event => {
      const item = event.target.closest('[role=option]');
      if (item && options.indexOf(item) !== active) highlight(options.indexOf(item), false);
    });
    let typed = '', typedTimer;
    list.addEventListener('keydown', event => {
      const moves = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: options.length - 1 };
      if (event.key in moves) { event.preventDefault(); highlight(moves[event.key]); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(active); }
      else if (event.key === 'Escape') { event.preventDefault(); close(); }
      else if (event.key === 'Tab') close(false);
      else if (event.key.length === 1) {
        // Type the first letters of an option to jump to it.
        typed += event.key.toLowerCase();
        clearTimeout(typedTimer);
        typedTimer = setTimeout(() => { typed = ''; }, 600);
        const match = options.findIndex(item => item.textContent.toLowerCase().startsWith(typed));
        if (match >= 0) highlight(match);
      }
    });
    document.addEventListener('click', event => { if (!field.contains(event.target)) close(false); });
    // A failed required check focuses the native select, which covers the field:
    // the browser message appears in place and the field shows its focus outline.
    select.addEventListener('change', render);
    select.form?.addEventListener('reset', () => setTimeout(render));
    render();
  });
})();
