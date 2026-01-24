<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <link rel="stylesheet" href="/output.css?v=2">
  <link rel="stylesheet" href="/css/base.css?v=2">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Comforter&display=swap" rel="stylesheet">
</head>
<body class="relative flex flex-col min-h-screen" {{backgroundStyle}}>
  <!-- Top Navigation -->
  <nav class="absolute top-0 left-0 w-full z-50 bg-transparent" style="height: 75px; background: transparent;">
    <div class="mx-auto flex justify-between items-center h-full px-4 bg-transparent">
      <!-- Logo -->
      <a href="/" class="font-title text-6xl pt-4 font-bold {{navColorClass}}"><b>Póth Rebeka</b></a>
      
      <!-- Desktop Nav Links -->
      <div id="nav-links" class="hidden md:flex {{navColorClass}}">
        <ul>
{{include:'topNav.md'}}
        </ul>
      </div>
      
      <!-- Mobile Hamburger Button -->
      <button id="hamburger-btn" class="block md:hidden text-5xl {{navColorClass}}" aria-label="Open menu" aria-expanded="false">≡</button>
    </div>
  </nav>
  
  <!-- Mobile Overlay Menu -->
  <div id="mobile-nav-overlay" class="hidden">
    <div class="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      <button id="close-mobile-nav" class="absolute top-6 right-8 text-white text-5xl" aria-label="Close menu">✕</button>
      <nav id="mobile-nav-list" class="flex-1 flex items-center justify-center">
        <ul>
{{include:'topNav.md'}}
        </ul>
      </nav>
    </div>
  </div>
  
  <!-- Main Content -->
  <main class="flex-1 min-h-screen {{mainClass}}">
{{main}}
  </main>
  
  <!-- Footer -->
  <footer class="bg-gray-800 text-white p-8 mt-auto">
    {{include:'footer.md'}}
  </footer>
  
  <script src="/js/client.js"></script>
  
</body>
</html>
