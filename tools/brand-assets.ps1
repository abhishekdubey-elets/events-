# =============================================================================
#  Elets Events — brand asset builder
# -----------------------------------------------------------------------------
#  Derives every file in public/assets/img/brand/ from one source image.
#
#  The official logo is white ink plus brand red (#ee3248) on transparency, and
#  it is a stacked lockup: wordmark, rule, "www.eletsonline.com", rule. Three
#  things follow from that, and this script handles all of them:
#
#   1. White artwork is invisible on the light theme. The theme's own
#      --logo-filter would fix that with invert(), but invert() swings the
#      brand red to cyan — so the white ink is recoloured to near-black
#      instead and the red is left exactly as it is.
#
#   2. The URL line is ~17px of a 68px-tall lockup. Scaled to a 28px header it
#      renders about 4px tall — an illegible smear. The header therefore gets a
#      wordmark-only crop, which also renders the letterforms ~1.5x larger in
#      the same vertical space. The footer keeps the full lockup, where there
#      is room to show the URL at a readable size.
#
#   3. Transparent margins waste the box. Every crop is trimmed to its ink.
#
#  Run:  powershell -ExecutionPolicy Bypass -File tools/brand-assets.ps1
#
#  When higher-resolution or vector art arrives, drop it at tools/brand/
#  logo-source.png and re-run: the crop bands below are proportional to the
#  source height, so they survive a resolution change of the same artwork.
# =============================================================================

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$src = Join-Path $root 'tools\brand\logo-source.png'
$out = Join-Path $root 'public\assets\img\brand'

if (-not (Test-Path $src)) { throw "Source artwork not found: $src" }
New-Item -ItemType Directory -Force -Path $out | Out-Null

$img = New-Object System.Drawing.Bitmap($src)
$INK = @{ R = 10; G = 11; B = 14 }   # --ink, light theme

# --- helpers ---------------------------------------------------------------

# Tight bounding box of visible ink within a horizontal band.
function Get-InkBounds($bmp, $y0, $y1) {
  $minx = [int]::MaxValue; $maxx = -1; $miny = [int]::MaxValue; $maxy = -1
  for ($y = $y0; $y -le $y1; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      if ($bmp.GetPixel($x, $y).A -gt 25) {
        if ($x -lt $minx) { $minx = $x }; if ($x -gt $maxx) { $maxx = $x }
        if ($y -lt $miny) { $miny = $y }; if ($y -gt $maxy) { $maxy = $y }
      }
    }
  }
  [pscustomobject]@{ X = $minx; Y = $miny; W = $maxx - $minx + 1; H = $maxy - $miny + 1 }
}

# A pixel belongs to the red mark if red clearly dominates. Anti-aliased blends
# between the red and the white sit above this threshold and stay red, which is
# what keeps the mark's edges clean after recolouring.
function Test-IsRed($c) { ($c.R - [Math]::Min($c.G, $c.B)) -gt 40 }

# Copy a region, optionally recolouring the white ink for light surfaces.
function Export-Variant($bmp, $box, $path, [switch]$ForLightSurface) {
  $dst = New-Object System.Drawing.Bitmap($box.W, $box.H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $box.H; $y++) {
    for ($x = 0; $x -lt $box.W; $x++) {
      $c = $bmp.GetPixel($box.X + $x, $box.Y + $y)
      if ($c.A -eq 0) { continue }
      if ($ForLightSurface -and -not (Test-IsRed $c)) {
        # Keep the alpha, swap the colour: anti-aliasing survives intact.
        $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($c.A, $INK.R, $INK.G, $INK.B))
      }
      else { $dst.SetPixel($x, $y, $c) }
    }
  }
  $dst.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host ("  {0,-26} {1}x{2}" -f (Split-Path $path -Leaf), $dst.Width, $dst.Height)
  $dst.Dispose()
}

# --- bands -----------------------------------------------------------------
# Proportions of the source height, so re-running against larger art works.
$wordmarkBottom = [int]($img.Height * 0.68)   # everything above the first rule

$lockup = Get-InkBounds $img 0 ($img.Height - 1)
$wordmark = Get-InkBounds $img 0 $wordmarkBottom
$redOnly = $null

# Bounds of the red 'e', for the square icon.
$minx = [int]::MaxValue; $maxx = -1; $miny = [int]::MaxValue; $maxy = -1
for ($y = 0; $y -lt $img.Height; $y++) {
  for ($x = 0; $x -lt $img.Width; $x++) {
    $c = $img.GetPixel($x, $y)
    if ($c.A -gt 120 -and (Test-IsRed $c)) {
      if ($x -lt $minx) { $minx = $x }; if ($x -gt $maxx) { $maxx = $x }
      if ($y -lt $miny) { $miny = $y }; if ($y -gt $maxy) { $maxy = $y }
    }
  }
}
$redOnly = [pscustomobject]@{ X = $minx; Y = $miny; W = $maxx - $minx + 1; H = $maxy - $miny + 1 }

Write-Host "Source: $($img.Width)x$($img.Height)"
Write-Host "  lockup   $($lockup.W)x$($lockup.H) at $($lockup.X),$($lockup.Y)"
Write-Host "  wordmark $($wordmark.W)x$($wordmark.H) at $($wordmark.X),$($wordmark.Y)"
Write-Host "  mark     $($redOnly.W)x$($redOnly.H) at $($redOnly.X),$($redOnly.Y)"
Write-Host "Writing:"

# --- artwork ---------------------------------------------------------------
Export-Variant $img $lockup   (Join-Path $out 'lockup-on-dark.png')
Export-Variant $img $lockup   (Join-Path $out 'lockup-on-light.png')  -ForLightSurface
Export-Variant $img $wordmark (Join-Path $out 'wordmark-on-dark.png')
Export-Variant $img $wordmark (Join-Path $out 'wordmark-on-light.png') -ForLightSurface

# --- square icons ----------------------------------------------------------
$crop = $img.Clone((New-Object System.Drawing.Rectangle($redOnly.X, $redOnly.Y, $redOnly.W, $redOnly.H)), $img.PixelFormat)
foreach ($size in 96, 256) {
  $pad = [int]($size * 0.14)
  $scale = [Math]::Min(($size - 2 * $pad) / $redOnly.W, ($size - 2 * $pad) / $redOnly.H)
  $w = [int]($redOnly.W * $scale); $h = [int]($redOnly.H * $scale)
  $canvas = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($crop, [int](($size - $w) / 2), [int](($size - $h) / 2), $w, $h)
  $g.Dispose()
  $canvas.Save((Join-Path $out "mark-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host ("  {0,-26} {1}x{1}" -f "mark-$size.png", $size)
  $canvas.Dispose()
}
$crop.Dispose(); $img.Dispose()
Write-Host "Done."
