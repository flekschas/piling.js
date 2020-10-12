<style>
  footer {
    margin-top: 1rem;
    padding: 2rem 0 0 0;
    font-size: 0.85em;
    color: var(--gray-medium);
    border-top: 1px solid var(--gray-medium);
    background: var(--bg-color);
  }

  a {
    box-shadow: inset 0 -1px 0 0 rgba(0, 0, 0, 0.125);
  }

  a:hover {
    box-shadow: inset 0 -2px 0 0 rgba(0, 0, 0, 0);
  }

  .vcg-name {
    font-weight: 600;
    text-align: right;
    font-size: 0.675rem;
    line-height: 0.75rem;
    padding-right: 0.2rem;
  }

  .logo-seas,
  .logo-vcg,
  .logo-edinburgh {
    background-size: cover;
  }

  .logo-seas {
    width: 3em; /* 3.3 (w) : 1 (h) */
    height: 3em;
  }

  .logo-vcg {
    width: 2.75em; /* 3.3 (w) : 1 (h) */
    height: 2.5em;
  }

  .logo-edinburgh {
    width: 3em; /* 3.3 (w) : 1 (h) */
    height: 3em;
  }

  #more-at-lekschas-de {
    margin-top: 2rem;
    padding: 0.75em 0;
    color: var(--bg-color);
    background: var(--gray-medium);
    box-shadow: none;
  }

  #more-at-lekschas-de:hover,
  #more-at-lekschas-de:focus,
  #more-at-lekschas-de:active {
    color: var(--bg-color);
    box-shadow: inset 0 -2.5em 0 0 var(--primary-color);
  }

  @media screen and (min-width: 30em) {
    .vcg-name {
      font-weight: 600;
      text-align: right;
      font-size: 0.85rem;
      line-height: 1rem;
      padding-right: 0.2rem;
    }

    .logo-seas,
    .logo-vcg,
    .logo-edinburgh {
      background-size: cover;
    }

    .logo-seas {
      width: 4em;
      height: 4em;
    }

    .logo-vcg {
      width: 4em;
      height: 3.5em;
    }

    .logo-edinburgh {
      width: 4em;
      height: 4em;
    }
  }

  /* 640px */
  @media screen and (min-width: 40em) {
    .vcg-name {
      font-weight: 600;
      text-align: right;
      font-size: 1rem;
      line-height: 1.125em;
      padding-right: 0;
    }

    .logo-seas,
    .logo-vcg,
    .logo-edinburgh {
      background-size: cover;
    }

    .logo-seas {
      width: 5.75em;
      height: 5em;
    }

    .logo-vcg {
      width: 5em;
      height: 4.25em;
    }

    .logo-edinburgh {
      width: 4.5em;
      height: 4.5em;
    }
  }
</style>

<footer id="footer">
  <div class="content">
    <div class="flex-c flex-jc-c flex-a-c">
      <div class="vcg-name flex-c flex-d-c">
        <span>Visual</span>
        <span>Computing</span>
        <span>Group</span>
      </div>
      <svg class="logo-vcg">
        <use
          xmlns:xlink="http://www.w3.org/1999/xlink"
          xlink:href="images/icons.svg#harvard-vcg"></use>
      </svg>
      <svg class="logo-seas">
        <use
          xmlns:xlink="http://www.w3.org/1999/xlink"
          xlink:href="images/icons.svg#harvard-seas"></use>
      </svg>
      <svg class="logo-edinburgh">
        <use
          xmlns:xlink="http://www.w3.org/1999/xlink"
          xlink:href="images/icons.svg#edinburgh"></use>
      </svg>
    </div>
  </div>
  <a href="https://lekschas.de" id="more-at-lekschas-de" class="flex-c flex-jc-c">
    <span>A Project by Fritz Lekschas</span>
  </a>
</footer>
