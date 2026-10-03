param(
  [string]$OutputPath = 'assets/characters-v3/identity-toppers/qa-head-registration-current.png',
  [string]$CloseupOutputPath = 'assets/characters-v3/identity-toppers/qa-neck-registration-current.png',
  [string]$HeadVersion = 'v7',
  [string]$FrontVersion = 'front-v5',
  [int]$HeadX = 71,
  [int]$HeadY = -11,
  [int]$HeadSize = 116
)

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$bodyPath = Join-Path $root 'assets/characters-v3/wardrobe/painted-outfit-bodies-atlas-v1-clean.png'
$headRoot = Join-Path $root 'assets/characters-v3/identity-toppers'
$resolvedOutput = Join-Path $root $OutputPath
$resolvedCloseupOutput = Join-Path $root $CloseupOutputPath

$actorWidth = 264
$actorHeight = 406
$bodyX = 66
$bodyY = 32
$bodyWidth = 132
$bodyHeight = 374
$cardWidth = 292
$cardHeight = 452

$canvas = [System.Drawing.Bitmap]::new($cardWidth * 4, $cardHeight * 3, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$canvas.SetResolution(96, 96)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#e9ded0'))
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$bodyAtlas = [System.Drawing.Bitmap]::new($bodyPath)
$bodySource = [System.Drawing.Rectangle]::new(710, 0, 355, 887)
$font = [System.Drawing.Font]::new('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
$labelBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#49352f'))
$cardBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#f8f2e9'))
$centerPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(96, 32, 139, 148), 1)
$centerPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash

for ($index = 0; $index -lt 12; $index++) {
  $column = $index % 4
  $row = [Math]::Floor($index / 4)
  $originX = ($column * $cardWidth) + 14
  $originY = ($row * $cardHeight) + 14
  $actorX = $originX + 0
  $actorY = $originY + 22
  $headId = 'head-{0:d2}' -f ($index + 1)
  $headPath = Join-Path $headRoot "forward-$headId-warm-medium-$HeadVersion.png"
  $frontHeadPath = Join-Path $headRoot "forward-$headId-warm-medium-$FrontVersion.png"
  $head = [System.Drawing.Bitmap]::new($headPath)
  $frontHead = [System.Drawing.Bitmap]::new($frontHeadPath)

  $graphics.FillRectangle($cardBrush, $originX - 7, $originY - 7, $actorWidth + 14, $actorHeight + 42)
  $graphics.DrawString($headId, $font, $labelBrush, $originX + 5, $originY - 2)
  $graphics.DrawLine($centerPen, $actorX + ($actorWidth / 2), $actorY, $actorX + ($actorWidth / 2), $actorY + $actorHeight)

  $headDestination = [System.Drawing.Rectangle]::new($actorX + $headX, $actorY + $headY, $headSize, $headSize)
  $graphics.DrawImage($head, $headDestination)

  $bodyDestination = [System.Drawing.Rectangle]::new($actorX + $bodyX, $actorY + $bodyY, $bodyWidth, $bodyHeight)
  $graphics.DrawImage($bodyAtlas, $bodyDestination, $bodySource, [System.Drawing.GraphicsUnit]::Pixel)

  $graphics.DrawImage($frontHead, $headDestination)
  $frontHead.Dispose()
  $head.Dispose()
}

$bodyAtlas.Dispose()
$centerPen.Dispose()
$cardBrush.Dispose()
$labelBrush.Dispose()
$font.Dispose()
$graphics.Dispose()
$canvas.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)

$closeupWidth = 400
$closeupHeight = 340
$closeup = [System.Drawing.Bitmap]::new($closeupWidth * 4, $closeupHeight * 3, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$closeup.SetResolution(96, 96)
$closeupGraphics = [System.Drawing.Graphics]::FromImage($closeup)
$closeupGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#e9ded0'))
$closeupGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$closeupGraphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
for ($index = 0; $index -lt 12; $index++) {
  $column = $index % 4
  $row = [Math]::Floor($index / 4)
  $source = [System.Drawing.Rectangle]::new(($column * $cardWidth) + 46, ($row * $cardHeight) + 20, 200, 170)
  $destination = [System.Drawing.Rectangle]::new($column * $closeupWidth, $row * $closeupHeight, $closeupWidth, $closeupHeight)
  $closeupGraphics.DrawImage($canvas, $destination, $source, [System.Drawing.GraphicsUnit]::Pixel)
}
$closeupGraphics.Dispose()
$closeup.Save($resolvedCloseupOutput, [System.Drawing.Imaging.ImageFormat]::Png)
$closeup.Dispose()
$canvas.Dispose()

Write-Output $resolvedOutput
Write-Output $resolvedCloseupOutput
