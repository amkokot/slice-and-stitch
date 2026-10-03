param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Output,
  [int]$Left,
  [int]$Top,
  [int]$Right,
  [int]$Bottom,
  [int]$Grow = 5,
  [double]$MaxSaturation = 0.30,
  [int]$MinBlue = 105,
  [int]$MinValue = 115
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$bitmap = [System.Drawing.Bitmap]::new($sourcePath)
$width = $bitmap.Width
$height = $bitmap.Height

$Left = [Math]::Max(0, $Left)
$Top = [Math]::Max(0, $Top)
$Right = [Math]::Min($width - 1, $Right)
$Bottom = [Math]::Min($height - 1, $Bottom)

$mask = [bool[]]::new($width * $height)

# Seed the mask from the garment's light, low-saturation fabric. The source is
# an on-body render, so this identifies the authored shirt silhouette in-place
# instead of attempting to refit a product image after the fact.
for ($y = $Top; $y -le $Bottom; $y++) {
  for ($x = $Left; $x -le $Right; $x++) {
    $pixel = $bitmap.GetPixel($x, $y)
    if ($pixel.A -lt 16) { continue }
    $max = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))
    $min = [Math]::Min($pixel.R, [Math]::Min($pixel.G, $pixel.B))
    $saturation = if ($max -eq 0) { 0 } else { ($max - $min) / $max }
    if ($max -ge $MinValue -and $pixel.B -ge $MinBlue -and $saturation -le $MaxSaturation) {
      $mask[$y * $width + $x] = $true
    }
  }
}

# Grow only a few pixels around the fabric seeds. This captures antialiasing,
# dark contour work, seams, and buttons while leaving the open collar, arms,
# lower body, and transparent canvas untouched.
for ($pass = 0; $pass -lt $Grow; $pass++) {
  $next = [bool[]]$mask.Clone()
  for ($y = $Top + 1; $y -lt $Bottom; $y++) {
    for ($x = $Left + 1; $x -lt $Right; $x++) {
      $index = $y * $width + $x
      if ($mask[$index]) { continue }
      if (
        $mask[$index - 1] -or $mask[$index + 1] -or
        $mask[$index - $width] -or $mask[$index + $width] -or
        $mask[$index - $width - 1] -or $mask[$index - $width + 1] -or
        $mask[$index + $width - 1] -or $mask[$index + $width + 1]
      ) {
        $next[$index] = $true
      }
    }
  }
  $mask = $next
}

$outputBitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$outputBitmap.SetResolution(96, 96)
for ($y = $Top; $y -le $Bottom; $y++) {
  for ($x = $Left; $x -le $Right; $x++) {
    $index = $y * $width + $x
    if ($mask[$index]) {
      $pixel = $bitmap.GetPixel($x, $y)
      if ($pixel.A -ge 16) { $outputBitmap.SetPixel($x, $y, $pixel) }
    }
  }
}

$outputDirectory = Split-Path -Parent $Output
if ($outputDirectory) { New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null }
$outputBitmap.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$outputBitmap.Dispose()
$bitmap.Dispose()

