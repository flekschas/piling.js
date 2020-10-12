<style>
  .gallery {
    display: flex;
    margin: 3rem 0;
    padding: 0;
    list-style: none;
  }

  @supports (display: grid) {
    .gallery {
      display: grid;
      grid-column-gap: 1rem;
      grid-row-gap: 1rem;
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .gallery figure {
    margin: 0;
    padding: 0.5rem;
    transition: transform var(--tnormal) var(--ease);
    background: white;
    border-radius: 0.25rem;
  }

  .gallery img {
    display: block;
  }

  .gallery .scale-up:hover {
    z-index: 10;
    transform: scale(1.1);
  }
</style>

<ol class="gallery">
  <li>
    <a href="/demos/?example=photos&options=1">
      <figure class="scale-up">
        <img
          src="images/example-photos.png"
          alt="Example: Photos"
        >
      </figure>
    </a>
  </li>
  <li>
    <a href="/demos/?example=scatterplots&options=1">
      <figure class="scale-up">
        <img
          src="images/example-scatter-plots.png"
          alt="Example: Scatter Plots"
        >
      </figure>
    </a>
  </li>
  <li>
    <a href="/demos/?example=microscopy&options=1">
      <figure class="scale-up">
        <img
          src="images/example-microscopy.png"
          alt="Example: Immunofluorescence Microscopy"
        >
      </figure>
    </a>
  </li>
  <li>
    <a href="/demos/?example=ridgeplot&options=1">
      <figure class="scale-up">
        <img
          src="images/example-line-charts.png"
          alt="Example: Ridge Plots"
        >
      </figure>
    </a>
  </li>
  <li>
    <a href="/demos/?example=matrices&options=1">
      <figure class="scale-up">
        <img
          src="images/example-matrices.png"
          alt="Example: Matrices"
        >
      </figure>
    </a>
  </li>
  <li>
    <a href="/demos/?example=timeseries&options=1">
      <figure class="scale-up">
        <img
          src="images/example-movie.png"
          alt="Example: Movie Frames"
        >
      </figure>
    </a>
  </li>
  <li>
    <a href="/demos/?example=drawings&options=1">
      <figure class="scale-up">
        <img
          src="images/example-drawings.png"
          alt="Example: Drawings"
        >
      </figure>
    </a>
  </li>
  <li>
    <a href="/demos/?example=covid&options=1">
      <figure class="scale-up">
        <img
          src="images/example-area-charts.png"
          alt="Example: Area Charts"
        >
      </figure>
    </a>
  </li>
</ol>
