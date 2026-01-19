<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <link rel="stylesheet" href="/output.css">
</head>
<body {{backgroundStyle}}>
  <!-- Top Navigation -->
  <nav class="fixed top-0 left-0 right-0 {{navColorClass}} p-4 shadow-md z-50">
    <div class="container mx-auto">
{{include:'topNav.md'}}
    </div>
  </nav>
  
  <!-- Main Content -->
  <main class="{{mainClass}}">
{{main}}
  </main>
  
  <!-- Footer -->
  <footer class="bg-gray-800 text-white p-8">
    <div class="container mx-auto">
{{include:'footer.md'}}
    </div>
  </footer>
</body>
</html>
